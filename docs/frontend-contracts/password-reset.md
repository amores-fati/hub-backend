# Contrato Frontend - Recuperacao e Troca de Senha

## Visao geral

Base publica da API:

```http
/api/auth
```

Existem dois fluxos diferentes:

- Recuperacao de senha: usuario esqueceu a senha, recebe um link por email e define uma nova senha.
- Troca de senha autenticada: usuario ja esta logado, informa a senha atual e define uma nova senha.

O fluxo de recuperacao funciona para todos os tipos de usuario (`ESTUDANTE`, `ADMINISTRADOR` e `EMPRESA`), porque usa a tabela `users` e nao depende de uma tela especifica por perfil.

## Recuperacao de senha

### 1. Solicitar email de recuperacao

```http
POST /api/auth/forgot-password
Content-Type: application/json
```

Payload:

```json
{
  "email": "usuario@email.com"
}
```

Resposta de sucesso:

```http
HTTP/1.1 200 OK
```

```json
{
  "message": "Se o e-mail estiver cadastrado, enviaremos as instrucoes para recuperacao de senha."
}
```

Regras para o frontend:

- Exibir uma mensagem generica de sucesso, mesmo se o email estiver errado.
- Nao esperar token na resposta.
- Nao informar ao usuario se a conta existe ou nao.
- Validar formato basico de email antes de enviar, mas manter a validacao final no backend.

Observacao de seguranca:

O backend retorna `200 OK` mesmo quando o email nao existe. Isso e intencional para evitar enumeracao de contas.

### 2. Link enviado por email

O backend envia um email com assunto:

```text
Recuperacao de senha
```

O link do email e montado com a variavel `FRONTEND_URL`:

```text
{FRONTEND_URL}/reset-password?token={token}
```

Exemplo em desenvolvimento:

```text
http://localhost:3000/reset-password?token=abc123
```

Contrato do frontend:

- Criar uma rota/pagina em `/reset-password`.
- Ler o token da query string `token`.
- Se o token nao existir na URL, mostrar erro e nao permitir envio do formulario.
- O frontend nao valida o token sozinho; apenas envia o token para o backend junto com a nova senha.

Exemplo:

```ts
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
```

### 3. Redefinir senha com token

```http
POST /api/auth/reset-password
Content-Type: application/json
```

Payload:

```json
{
  "token": "token_recebido_na_url",
  "newPassword": "NovaSenha123"
}
```

Resposta de sucesso:

```http
HTTP/1.1 200 OK
```

```json
{
  "message": "Senha redefinida com sucesso."
}
```

Validacoes atuais:

- `token`: obrigatorio, string nao vazia.
- `newPassword`: obrigatoria, string, minimo 8 caracteres, maximo 100 caracteres.

Erros esperados:

```http
HTTP/1.1 400 Bad Request
```

Token invalido, expirado, usado ou inexistente:

```json
{
  "message": "Token invalido ou expirado.",
  "error": "Bad Request",
  "statusCode": 400
}
```

Senha invalida:

```json
{
  "message": ["A nova senha deve ter no minimo 8 caracteres"],
  "error": "Bad Request",
  "statusCode": 400
}
```

Regras para o frontend:

- Pedir `newPassword` e confirmacao local da nova senha.
- Enviar apenas `token` e `newPassword`; a confirmacao nao vai para o backend.
- Em sucesso, redirecionar para login e informar que a senha foi redefinida.
- Em `400`, exibir a mensagem retornada pelo backend.
- Nao reutilizar o token apos sucesso.

Regras do backend que impactam o frontend:

- O token expira conforme `RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES`, hoje configurado como 30 minutos.
- O token e de uso unico.
- Ao pedir um novo email de recuperacao, tokens pendentes anteriores daquele usuario sao invalidados.

## Troca de senha autenticada

Use este fluxo quando o usuario ja esta logado e quer trocar a propria senha.

```http
POST /api/auth/change-password
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Payload:

```json
{
  "currentPassword": "SenhaAtual123",
  "newPassword": "NovaSenha123"
}
```

Resposta de sucesso:

```http
HTTP/1.1 200 OK
```

```json
{
  "message": "Senha alterada com sucesso."
}
```

Validacoes atuais:

- `currentPassword`: obrigatoria, string nao vazia.
- `newPassword`: obrigatoria, string, minimo 8 caracteres, maximo 100 caracteres.

Erros esperados:

Token ausente ou invalido:

```http
HTTP/1.1 401 Unauthorized
```

Senha atual incorreta:

```http
HTTP/1.1 401 Unauthorized
```

```json
{
  "message": "Credenciais invalidas",
  "error": "Unauthorized",
  "statusCode": 401
}
```

Nova senha invalida:

```http
HTTP/1.1 400 Bad Request
```

```json
{
  "message": ["A nova senha deve ter no minimo 8 caracteres"],
  "error": "Bad Request",
  "statusCode": 400
}
```

Regras para o frontend:

- Exigir usuario autenticado.
- Enviar o JWT no header `Authorization`.
- Pedir senha atual, nova senha e confirmacao local da nova senha.
- Enviar apenas `currentPassword` e `newPassword`.
- Em sucesso, manter ou encerrar a sessao conforme decisao de produto. O backend atual nao invalida JWTs ja emitidos.

## Exemplos de integracao

### Solicitar recuperacao

```ts
async function requestPasswordReset(email: string) {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? 'Erro ao solicitar recuperacao de senha.');
  }

  return data;
}
```

### Redefinir senha

```ts
async function resetPassword(token: string, newPassword: string) {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join('\n')
      : data?.message;

    throw new Error(message ?? 'Erro ao redefinir senha.');
  }

  return data;
}
```

### Trocar senha autenticado

```ts
async function changePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string,
) {
  const response = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join('\n')
      : data?.message;

    throw new Error(message ?? 'Erro ao alterar senha.');
  }

  return data;
}
```

## Checklist para o frontend

- [ ] Tela "Esqueci minha senha" enviando `POST /api/auth/forgot-password`.
- [ ] Mensagem generica apos solicitacao de recuperacao.
- [ ] Rota `/reset-password` lendo `token` da query string.
- [ ] Formulario de nova senha com confirmacao local.
- [ ] Chamada `POST /api/auth/reset-password` com `token` e `newPassword`.
- [ ] Redirecionamento para login apos reset com sucesso.
- [ ] Tela autenticada de troca de senha usando `POST /api/auth/change-password`.
- [ ] Tratamento de `400` e `401` usando `message` retornado pelo backend.

## Configuracao de ambiente

Para desenvolvimento local, o backend gera links com:

```env
FRONTEND_URL=http://localhost:3000
```

Em producao, essa variavel precisa apontar para a URL real do frontend:

```env
FRONTEND_URL=https://seu-front-em-producao.com
```

O frontend nao deve receber nem armazenar credenciais SMTP. As variaveis `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` e `EMAIL_FROM` pertencem somente ao backend.
