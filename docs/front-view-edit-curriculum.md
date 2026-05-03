# Front - Consumo da feature `feat/view-edit-curriculum`

## Contexto

Esta feature expoe o curriculo do aluno autenticado para visualizacao e edicao pelo front.

Base local padrao:

- API: `http://localhost:3001`
- Prefixo global: `/api`
- Swagger: `http://localhost:3001/docs`

Todas as rotas abaixo exigem JWT no header:

```http
Authorization: Bearer <accessToken>
```

O `accessToken` vem do login:

```http
POST /api/auth/login
```

Resposta:

```json
{
  "accessToken": "jwt..."
}
```

Use estas rotas com usuario do tipo aluno. O backend usa o `sub` do JWT como `studentId`; o front nao envia `studentId` no body nem na URL.

## Rotas

| Acao | Metodo | Rota principal | Alias aceito |
| --- | --- | --- | --- |
| Buscar curriculo | `GET` | `/api/students/me/resume` | `/api/users/student/resume` |
| Criar/atualizar dados principais | `PUT` | `/api/students/me/resume` | `/api/users/student/resume` |
| Atualizar foto | `POST` | `/api/students/me/resume/photo` | `/api/users/student/resume/photo` |
| Adicionar habilidade | `POST` | `/api/students/me/resume/skills` | `/api/users/student/resume/skills` |
| Remover habilidade | `DELETE` | `/api/students/me/resume/skills/:skillId` | `/api/users/student/resume/skills/:skillId` |

Recomendacao para o front: consumir as rotas principais (`/students/me/...`). Os aliases foram mantidos para compatibilidade.

## Modelo de curriculo

Resposta de `GET /api/students/me/resume` e `PUT /api/students/me/resume`:

```ts
type StudentResume = {
  id: string;
  about: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  photoUrl: string | null;
  skills: ResumeSkill[];
};

type ResumeSkill = {
  id: string;
  skillName: string;
};
```

Exemplo:

```json
{
  "id": "1d8f37f5-91a9-4c44-b75c-7a4f7576ad21",
  "about": "Desenvolvedor em formacao.",
  "linkedinUrl": "https://www.linkedin.com/in/aluno",
  "githubUrl": "https://github.com/aluno",
  "photoUrl": "/uploads/resume-photos/student-id/foto.webp",
  "skills": [
    {
      "id": "6bbf4bd3-7a2e-4a8d-bab7-91c0ea16bb5d",
      "skillName": "TypeScript"
    }
  ]
}
```

Observacoes:

- `photoUrl` e uma URL relativa. Para exibir localmente, concatene com a base da API: `http://localhost:3001/uploads/...`.
- `studentId`, `isAvailable` e `videoPresentation` nao sao retornados nesta feature.
- `skills[].id` e o id global da habilidade na tabela `skills`; use esse valor no `DELETE`.

## Buscar curriculo

```http
GET /api/students/me/resume
```

Respostas:

- `200 OK`: retorna `StudentResume`.
- `401 Unauthorized`: JWT ausente, invalido ou expirado.
- `404 Not Found`: o aluno autenticado ainda nao tem curriculo.

Se receber `404` no carregamento da tela de edicao, o front pode tratar como estado vazio. O `PUT`, o upload de foto e o `POST` de skill criam o curriculo automaticamente se o aluno existir.

Exemplo de erro `404`:

```json
{
  "statusCode": 404,
  "message": "Curriculo nao encontrado para o aluno: <studentId>",
  "error": "Not Found",
  "errorKind": "NOT_FOUND"
}
```

## Criar ou atualizar dados principais

```http
PUT /api/students/me/resume
Content-Type: application/json
```

Body:

```ts
type UpdateStudentResumeBody = {
  about?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
};
```

Exemplo:

```json
{
  "about": "Desenvolvedor em formacao com interesse em backend.",
  "linkedinUrl": "https://www.linkedin.com/in/aluno",
  "githubUrl": "https://github.com/aluno"
}
```

Comportamento importante:

- O update e parcial: campos omitidos permanecem como estao.
- Enviar `null` limpa o campo.
- `linkedinUrl` e `githubUrl` precisam ser URLs absolutas com protocolo `http://` ou `https://`.
- Para inputs vazios de `linkedinUrl` e `githubUrl`, envie `null` ou omita o campo; enviar `""` falha na validacao de URL.
- Campos extras no body sao ignorados pelo `ValidationPipe` do backend.
- Nao envie `skills` nem `photoUrl` nesta rota; eles possuem endpoints proprios.

Respostas:

- `200 OK`: retorna `StudentResume`.
- `400 Bad Request`: body invalido ou URL invalida.
- `401 Unauthorized`: JWT ausente, invalido ou expirado.
- `404 Not Found`: usuario autenticado nao corresponde a um aluno existente.

Exemplo de erro por URL invalida:

```json
{
  "statusCode": 400,
  "message": "URL invalida para o campo linkedinUrl.",
  "error": "Bad Request",
  "errorKind": "VALIDATION_ERROR"
}
```

## Atualizar foto

```http
POST /api/students/me/resume/photo
Content-Type: multipart/form-data
```

Campo esperado no form-data:

| Campo | Tipo | Obrigatorio |
| --- | --- | --- |
| `photo` | arquivo | sim |

Regras do arquivo:

- MIME aceitos: `image/jpeg`, `image/png`, `image/webp`.
- Tamanho maximo: `5 MB`.

Resposta `200 OK`:

```json
{
  "photoUrl": "/uploads/resume-photos/123e4567-e89b-12d3-a456-426614174000/9b0b5b0e-4bc2-4bb9-a92b-4a882d84f2f0.png"
}
```

Depois do upload, use a `photoUrl` retornada para atualizar a imagem no estado do front. Um `GET` posterior tambem retorna a mesma URL no campo `photoUrl`.

Exemplo com `fetch`:

```ts
const formData = new FormData();
formData.append("photo", file);

const response = await fetch(`${API_URL}/api/students/me/resume/photo`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
  body: formData,
});
```

Nao defina manualmente `Content-Type` neste caso; deixe o browser montar o boundary do `multipart/form-data`.

Erros:

- `400 Bad Request` com `errorKind: "INVALID_FILE"` para arquivo ausente, MIME nao aceito ou tamanho maior que 5 MB.
- `401 Unauthorized` para JWT invalido.
- `404 Not Found` se o usuario autenticado nao for aluno.

Exemplo de erro de arquivo:

```json
{
  "statusCode": 400,
  "message": "Arquivo de foto invalido.",
  "error": "Bad Request",
  "errorKind": "INVALID_FILE"
}
```

## Adicionar habilidade

```http
POST /api/students/me/resume/skills
Content-Type: application/json
```

Body:

```ts
type AddResumeSkillBody = {
  skillName: string;
};
```

Exemplo:

```json
{
  "skillName": "TypeScript"
}
```

Comportamento:

- O backend aplica `trim()` em `skillName`.
- `skillName` e obrigatorio e deve ter no maximo `100` caracteres.
- A comparacao de duplicidade no curriculo ignora maiusculas/minusculas. Exemplo: `TypeScript` e `typescript` contam como a mesma skill.
- Se a skill ainda nao existir na tabela global `skills`, o backend cria.
- Se o curriculo ainda nao existir, ele e criado antes de vincular a skill.

Resposta `201 Created`:

```json
{
  "id": "6bbf4bd3-7a2e-4a8d-bab7-91c0ea16bb5d",
  "skillName": "TypeScript"
}
```

Erros:

- `400 Bad Request` com `errorKind: "VALIDATION_ERROR"` para nome vazio.
- `400 Bad Request` padrao do `class-validator` para tipo invalido ou mais de 100 caracteres.
- `409 Conflict` com `errorKind: "CONFLICT"` para skill duplicada no curriculo.
- `401 Unauthorized` para JWT invalido.
- `404 Not Found` se o usuario autenticado nao for aluno.

Exemplo de duplicidade:

```json
{
  "statusCode": 409,
  "message": "Habilidade ja cadastrada no curriculo: TypeScript",
  "error": "Conflict",
  "errorKind": "CONFLICT"
}
```

## Remover habilidade

```http
DELETE /api/students/me/resume/skills/:skillId
```

Use `skillId = skills[].id` retornado no curriculo ou no `POST` de skill.

Resposta:

- `204 No Content`: removida com sucesso, sem body.
- `400 Bad Request`: `skillId` nao e UUID valido.
- `401 Unauthorized`: JWT ausente, invalido ou expirado.
- `404 Not Found`: skill nao pertence ao curriculo do aluno ou curriculo nao existe.

Exemplo de erro `404`:

```json
{
  "statusCode": 404,
  "message": "Habilidade nao encontrada no curriculo: <skillId>",
  "error": "Not Found",
  "errorKind": "NOT_FOUND"
}
```

## Fluxo sugerido de tela

1. Ao abrir a tela, chamar `GET /api/students/me/resume`.
2. Se `200`, preencher formulario com `about`, `linkedinUrl`, `githubUrl`, `photoUrl` e `skills`.
3. Se `404` com `errorKind: "NOT_FOUND"`, iniciar formulario vazio e lista de skills vazia.
4. Salvar dados principais com `PUT /api/students/me/resume`.
5. Fazer upload da foto separadamente com `POST /api/students/me/resume/photo`.
6. Adicionar skill com `POST /api/students/me/resume/skills` e inserir o item retornado na lista local.
7. Remover skill com `DELETE /api/students/me/resume/skills/:skillId` e remover da lista local apos `204`.

## Tratamento de erros no front

Formato comum dos erros tratados manualmente pela feature:

```ts
type ApiError = {
  statusCode: number;
  message: string;
  error: string;
  errorKind?: "NOT_FOUND" | "VALIDATION_ERROR" | "INVALID_FILE" | "CONFLICT";
};
```

Nem todo `400` tera `errorKind`. Erros gerados diretamente pelo `class-validator` ou pelo `ParseUUIDPipe` podem vir no formato padrao do Nest, com `message` como array ou string.

Mapeamento pratico:

| Status | `errorKind` | Uso sugerido |
| --- | --- | --- |
| `401` | ausente | Redirecionar para login ou renovar sessao |
| `404` | `NOT_FOUND` no `GET` | Mostrar formulario vazio |
| `404` | `NOT_FOUND` no `DELETE` | Remover feedback otimista ou recarregar curriculo |
| `400` | `VALIDATION_ERROR` | Mostrar erro no campo relacionado |
| `400` | `INVALID_FILE` | Mostrar erro de arquivo/foto |
| `409` | `CONFLICT` | Informar que a skill ja existe |

## Detalhes de backend relevantes

- Controller: `src/adapters/in/controllers/student-resume.controller.ts`
- DTOs: `src/adapters/in/dtos/student-resume/`
- Service: `src/core/services/student-resume.service.ts`
- Entidade de dominio: `src/core/domain/curriculum.entity.ts`
- Storage local de fotos: `uploads/resume-photos/<studentId>/<uuid>.<ext>`
- Migration da feature: `1777500000000-RelaxCurriculumResumeFields`

A migration deixa `linkedin`, `github` e `video_presentation` nullable na tabela `curriculum`, permitindo que o front salve curriculo incompleto ou limpe campos opcionais.
