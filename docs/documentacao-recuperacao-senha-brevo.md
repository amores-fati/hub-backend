# Documentacao Tecnica - Recuperacao de Senha com Brevo

## 1. Objetivo

Esta documentacao adapta a proposta de recuperacao de senha com Brevo para o backend atual do projeto `hub-backend`.

A funcionalidade deve permitir que um usuario solicite a redefinicao de senha por email, receba um link temporario e cadastre uma nova senha sem expor a existencia da conta e sem salvar tokens ou senhas em texto puro.

## 2. Contexto do Projeto

O backend atual usa:

- NestJS como framework HTTP.
- TypeORM como ORM.
- PostgreSQL como banco.
- bcrypt para hash de senha.
- JWT para autenticacao.
- Arquitetura em camadas com `core`, `ports`, `services`, `adapters/in` e `adapters/out`.

Hoje existe somente o fluxo de login em `POST /auth/login`.

Nao existe ainda:

- rota publica de solicitacao de recuperacao de senha;
- rota publica de redefinicao de senha;
- tabela de tokens de recuperacao;
- porta de envio de email;
- implementacao SMTP;
- invalidacao de tokens de recuperacao antigos;
- testes especificos para recuperacao de senha.

## 3. Decisao Tecnica

A decisao proposta para envio de email e:

```text
Brevo Free Plan + SMTP Relay + Nodemailer no backend
```

Motivos:

- custo inicial zero;
- integracao simples via SMTP;
- adequado para email transacional;
- permite trocar o provedor no futuro mantendo a porta `IMailService`;
- evita expor credenciais no frontend;
- pode evoluir futuramente para Brevo API e templates transacionais.

Antes de colocar em producao, conferir os limites atuais do plano gratuito e a configuracao oficial de SMTP:

- https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan
- https://developers.brevo.com/docs/smtp-integration
- https://nodemailer.com/smtp

## 4. Fluxo Alvo

```text
Usuario informa email no frontend
        |
Frontend chama POST /auth/forgot-password
        |
Backend normaliza e valida o email
        |
Backend busca usuario pelo email
        |
Se usuario existir:
  - gera token aleatorio forte
  - salva somente o hash do token
  - define expiracao curta
  - invalida tokens pendentes anteriores do usuario
  - envia email com link de redefinicao via Brevo SMTP
        |
Backend sempre retorna mensagem generica
        |
Usuario acessa FRONTEND_URL/reset-password?token=...
        |
Frontend envia token e nova senha para POST /auth/reset-password
        |
Backend valida token, expiracao e uso unico
        |
Backend salva nova senha com bcrypt
        |
Backend marca token como usado
```

O frontend nunca deve enviar email diretamente via Brevo e nunca deve receber credenciais SMTP.

## 5. Rotas Necessarias

### 5.1 Solicitar recuperacao de senha

```http
POST /auth/forgot-password
```

Payload:

```json
{
  "email": "usuario@email.com"
}
```

Resposta recomendada, sempre igual:

```json
{
  "message": "Se o e-mail estiver cadastrado, enviaremos as instrucoes para recuperacao de senha."
}
```

Regras:

- retornar `200 OK` mesmo quando o email nao existir;
- nao expor se o usuario existe;
- nao retornar token no body;
- nao logar email completo em nivel desnecessario;
- aplicar rate limit no endpoint.

### 5.2 Redefinir senha

```http
POST /auth/reset-password
```

Payload:

```json
{
  "token": "token_recebido_por_email",
  "newPassword": "NovaSenha@123"
}
```

Resposta de sucesso:

```json
{
  "message": "Senha redefinida com sucesso."
}
```

Resposta para token invalido, expirado ou usado:

```json
{
  "message": "Token invalido ou expirado."
}
```

Regras:

- validar token pelo hash;
- aceitar somente token nao usado;
- aceitar somente token nao expirado;
- salvar nova senha com o `IHashService` atual;
- marcar token como usado depois da troca;
- preferencialmente executar atualizacao de senha e token em transacao.

## 6. Estrutura de Banco

Criar uma nova tabela:

```text
password_reset_tokens
```

Campos recomendados:

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | `uuid` | chave primaria |
| `user_id` | `uuid` | FK para `users.id` |
| `token_hash` | `varchar(255)` | hash SHA-256 do token puro |
| `expires_at` | `timestamptz` | data/hora de expiracao |
| `used` | `boolean` | default `false` |
| `created_at` | `timestamptz` | default `NOW()` |
| `used_at` | `timestamptz` | nullable |

Indices recomendados:

- `ix_password_reset_tokens__user_id`
- `ix_password_reset_tokens__token_hash`
- `ix_password_reset_tokens__expires_at`

Constraint recomendada:

- FK `user_id -> users.id` com `ON DELETE CASCADE`.

## 7. Migration TypeORM

Criar uma migration em:

```text
src/adapters/out/migrations/<timestamp>-CreatePasswordResetTokens.ts
```

Modelo:

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetTokens0000000000000
  implements MigrationInterface
{
  name = 'CreatePasswordResetTokens0000000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying(255) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "used" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "used_at" timestamptz,
        CONSTRAINT "pk_password_reset_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "fk_password_reset_tokens__user_id__users"
          FOREIGN KEY ("user_id") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "ix_password_reset_tokens__user_id"
      ON "password_reset_tokens" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "ix_password_reset_tokens__token_hash"
      ON "password_reset_tokens" ("token_hash")
    `);

    await queryRunner.query(`
      CREATE INDEX "ix_password_reset_tokens__expires_at"
      ON "password_reset_tokens" ("expires_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "ix_password_reset_tokens__expires_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "ix_password_reset_tokens__token_hash"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "ix_password_reset_tokens__user_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
  }
}
```

O timestamp e o nome da classe devem seguir o padrao das migrations existentes.

## 8. Entidade TypeORM

Criar:

```text
src/adapters/out/orm/password-reset-token.orm-entity.ts
```

Modelo:

```ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

@Entity('password_reset_tokens')
export class PasswordResetTokenOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  used: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  createdAt: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;
}
```

Adicionar essa entidade ao `TypeOrmModule.forFeature` em `src/app.module.ts`.

## 9. Ports Necessarias

### 9.1 Repositorio de tokens

Criar:

```text
src/core/ports/password-reset-token.repository.interface.ts
```

Contrato sugerido:

```ts
export const IPasswordResetTokenRepository = Symbol(
  'IPasswordResetTokenRepository',
);

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  usedAt: Date | null;
}

export interface IPasswordResetTokenRepository {
  create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken>;

  findValidByTokenHash(tokenHash: string, now: Date): Promise<PasswordResetToken | null>;

  markAsUsed(id: string, usedAt: Date): Promise<void>;

  invalidatePendingByUserId(userId: string, usedAt: Date): Promise<void>;
}
```

### 9.2 Servico de email

Criar:

```text
src/core/ports/mail.service.interface.ts
```

Contrato sugerido:

```ts
export const IMailService = Symbol('IMailService');

export interface SendPasswordResetEmailInput {
  to: string;
  resetLink: string;
}

export interface IMailService {
  sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<void>;
}
```

## 10. Adapters Out

### 10.1 Repositorio TypeORM

Criar:

```text
src/adapters/out/repository/password-reset-token.repository.ts
```

Responsabilidades:

- persistir `token_hash`, `user_id` e `expires_at`;
- buscar token valido por hash;
- marcar token como usado;
- invalidar tokens pendentes de um usuario.

A busca de token valido deve filtrar:

```text
token_hash = input
used = false
expires_at > now
```

### 10.2 Email via Nodemailer

Instalar:

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

Criar:

```text
src/adapters/out/mail/nodemailer-mail.service.ts
```

Modelo:

```ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import {
  IMailService,
  SendPasswordResetEmailInput,
} from '../../../core/ports/mail.service.interface';

@Injectable()
export class NodemailerMailService implements IMailService {
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('SMTP_HOST'),
      port: Number(this.configService.get<string>('SMTP_PORT', '587')),
      secure: false,
      auth: {
        user: this.configService.getOrThrow<string>('SMTP_USER'),
        pass: this.configService.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });
  }

  async sendPasswordResetEmail({
    to,
    resetLink,
  }: SendPasswordResetEmailInput): Promise<void> {
    await this.transporter.sendMail({
      from: this.configService.getOrThrow<string>('EMAIL_FROM'),
      to,
      subject: 'Recuperacao de senha',
      text: [
        'Ola,',
        '',
        'Recebemos uma solicitacao para redefinir sua senha.',
        '',
        `Acesse o link abaixo para criar uma nova senha:`,
        resetLink,
        '',
        'Este link e temporario.',
        '',
        'Se voce nao solicitou essa recuperacao, ignore este email.',
      ].join('\n'),
      html: `
        <p>Ola,</p>
        <p>Recebemos uma solicitacao para redefinir sua senha.</p>
        <p><a href="${resetLink}">Clique aqui para criar uma nova senha</a></p>
        <p>Este link e temporario.</p>
        <p>Se voce nao solicitou essa recuperacao, ignore este email.</p>
      `,
    });
  }
}
```

Registrar `IMailService` em `src/app.module.ts`.

## 11. DTOs

Criar pasta:

```text
src/adapters/in/dtos/password-reset
```

### 11.1 ForgotPasswordDto

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
```

### 11.2 ResetPasswordDto

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'token_recebido_por_email' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NovaSenha@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  newPassword: string;
}
```

Observacao: recomenda-se alinhar a regra de senha de criacao de aluno/empresa com a mesma politica minima.

## 12. Commands

Criar ou estender:

```text
src/core/command/auth.command.ts
```

Com:

```ts
export interface ForgotPasswordCommand {
  email: string;
}

export interface ResetPasswordCommand {
  token: string;
  newPassword: string;
}
```

## 13. AuthService

Estender `src/core/services/auth.service.ts`.

Novas dependencias:

- `IPasswordResetTokenRepository`
- `IMailService`
- `IHashService` ja existe
- `IUserRepository` ja existe

Utilitarios:

```ts
import { createHash, randomBytes } from 'crypto';

private createPasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

private hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
```

### 13.1 forgotPassword

Fluxo:

```ts
async forgotPassword(command: ForgotPasswordCommand): Promise<void> {
  const user = await this.userRepository.findByEmail(command.email);

  if (!user) {
    return;
  }

  const token = this.createPasswordResetToken();
  const tokenHash = this.hashPasswordResetToken(token);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + this.passwordResetExpirationMinutes * 60 * 1000,
  );

  await this.passwordResetTokenRepository.invalidatePendingByUserId(
    user.id,
    now,
  );

  await this.passwordResetTokenRepository.create({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const resetLink = `${this.frontendUrl}/reset-password?token=${token}`;

  await this.mailService.sendPasswordResetEmail({
    to: user.email,
    resetLink,
  });
}
```

O controller deve sempre retornar mensagem generica, mesmo se esse metodo nao enviar email.

### 13.2 resetPassword

Fluxo:

```ts
async resetPassword(command: ResetPasswordCommand): Promise<void> {
  const tokenHash = this.hashPasswordResetToken(command.token);
  const now = new Date();

  const resetToken =
    await this.passwordResetTokenRepository.findValidByTokenHash(
      tokenHash,
      now,
    );

  if (!resetToken) {
    throw new InvalidPasswordResetTokenException();
  }

  const user = await this.userRepository.findById(resetToken.userId);

  if (!user) {
    throw new InvalidPasswordResetTokenException();
  }

  const hashedPassword = await this.hashService.hash(command.newPassword);
  user.changePassword(hashedPassword);

  await this.userRepository.updatePassword(user.id, hashedPassword);
  await this.passwordResetTokenRepository.markAsUsed(resetToken.id, now);
}
```

Para isso, sera necessario adicionar ao `IUserRepository`:

```ts
updatePassword(id: string, passwordHash: string): Promise<void>;
```

E implementar no `UserRepository`.

Observacao: o ideal e que `updatePassword` e `markAsUsed` rodem em transacao para evitar token valido depois de uma atualizacao parcial.

## 14. AuthController

Adicionar em `src/adapters/in/controllers/auth.controller.ts`.

### 14.1 forgot-password

```ts
@Post('forgot-password')
@HttpCode(HttpStatus.OK)
async forgotPassword(@Body() dto: ForgotPasswordDto) {
  await this.authService.forgotPassword({ email: dto.email });

  return {
    message:
      'Se o e-mail estiver cadastrado, enviaremos as instrucoes para recuperacao de senha.',
  };
}
```

### 14.2 reset-password

```ts
@Post('reset-password')
@HttpCode(HttpStatus.OK)
async resetPassword(@Body() dto: ResetPasswordDto) {
  await this.authService.resetPassword({
    token: dto.token,
    newPassword: dto.newPassword,
  });

  return {
    message: 'Senha redefinida com sucesso.',
  };
}
```

Mapear `InvalidPasswordResetTokenException` para `BadRequestException`.

## 15. Variaveis de Ambiente

Adicionar no `.env` do backend:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=seu_usuario_smtp_brevo
SMTP_PASSWORD=sua_smtp_key_brevo
EMAIL_FROM=naoresponda@seudominio.com.br
FRONTEND_URL=https://seudominio.com.br
RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES=30
```

Regras:

- `SMTP_USER` e `SMTP_PASSWORD` nunca devem ir para o frontend;
- em producao, usar dominio proprio autenticado;
- configurar DKIM, DMARC e SPF quando aplicavel;
- em desenvolvimento, pode-se usar Mailtrap ou uma conta Brevo de teste.

## 16. Seguranca

Regras obrigatorias:

- nao recuperar senha antiga;
- nao enviar senha por email;
- nao salvar senha em texto puro;
- salvar senha somente com bcrypt;
- salvar somente hash SHA-256 do token de recuperacao;
- usar token aleatorio forte com `randomBytes(32)`;
- expirar token em prazo curto, recomendado: 30 minutos;
- marcar token como usado depois da redefinicao;
- invalidar tokens pendentes anteriores ao gerar novo token;
- retornar mensagem generica no `forgot-password`;
- nao expor se o email existe;
- aplicar rate limit por IP e, se possivel, por email normalizado;
- nao logar token puro;
- nao logar SMTP credentials;
- nao retornar token em respostas HTTP.

Ponto adicional do projeto atual: os endpoints autenticados de update de aluno/empresa aceitam alteracao de `password`. Antes ou junto desta entrega, recomenda-se corrigir a autorizacao para impedir que um usuario comum altere o registro de outro usuario pelo `id` da URL.

## 17. AppModule

Atualizar `src/app.module.ts`:

- importar `PasswordResetTokenOrmEntity`;
- adicionar entidade ao `TypeOrmModule.forFeature`;
- registrar `IPasswordResetTokenRepository`;
- registrar `IMailService`;
- atualizar factory de `AuthService` para injetar as novas dependencias.

Exemplo conceitual:

```ts
{
  provide: IPasswordResetTokenRepository,
  useClass: PasswordResetTokenRepository,
},
{
  provide: IMailService,
  useClass: NodemailerMailService,
},
```

## 18. Testes Recomendados

### 18.1 Unitarios

Adicionar testes para `AuthService`:

- `forgotPassword` retorna sem erro quando email nao existe;
- `forgotPassword` gera token, salva hash e envia email quando usuario existe;
- `forgotPassword` invalida tokens pendentes anteriores;
- `resetPassword` rejeita token inexistente;
- `resetPassword` rejeita token usado;
- `resetPassword` rejeita token expirado;
- `resetPassword` altera senha com hash e marca token como usado;
- token puro nao e salvo no repositorio.

### 18.2 Integracao/E2E

Adicionar testes:

- `POST /auth/forgot-password` sempre retorna mensagem generica;
- `POST /auth/reset-password` com token valido permite login com a nova senha;
- `POST /auth/reset-password` nao permite reutilizar o mesmo token;
- `POST /auth/reset-password` rejeita senha invalida;
- `POST /auth/reset-password` rejeita token expirado.

Para e2e, usar um `IMailService` fake em ambiente de teste para capturar o link sem enviar email real.

## 19. Checklist de Implementacao

- [ ] Instalar `nodemailer` e `@types/nodemailer`.
- [ ] Criar migration `password_reset_tokens`.
- [ ] Criar `PasswordResetTokenOrmEntity`.
- [ ] Criar `IPasswordResetTokenRepository`.
- [ ] Criar `PasswordResetTokenRepository`.
- [ ] Criar `IMailService`.
- [ ] Criar `NodemailerMailService`.
- [ ] Criar DTOs `ForgotPasswordDto` e `ResetPasswordDto`.
- [ ] Criar exception `InvalidPasswordResetTokenException`.
- [ ] Adicionar commands em `auth.command.ts`.
- [ ] Estender `AuthService`.
- [ ] Adicionar `updatePassword` ao `IUserRepository` e `UserRepository`.
- [ ] Adicionar rotas no `AuthController`.
- [ ] Registrar entidades e providers no `AppModule`.
- [ ] Adicionar variaveis SMTP no `.env` e documentar no guia de ambientes.
- [ ] Adicionar testes unitarios.
- [ ] Adicionar testes e2e.
- [ ] Corrigir autorizacao dos updates de aluno/empresa que alteram senha por `:id`.

## 20. Resumo Executivo

A proposta original de Brevo SMTP e adequada, mas precisa ser implementada seguindo a arquitetura atual do backend.

A adaptacao correta para este projeto e:

```text
NestJS Controller
  -> AuthService
  -> IUserRepository
  -> IPasswordResetTokenRepository
  -> IMailService
  -> TypeORM/PostgreSQL + Nodemailer/Brevo
```

O frontend fica responsavel apenas por solicitar a recuperacao e enviar o token recebido no link junto com a nova senha. O backend gera o token, salva somente o hash, envia o email, valida expiracao/uso unico e persiste a nova senha com bcrypt.
