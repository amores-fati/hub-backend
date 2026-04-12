# TypeScript Style Guide

Este documento define os padrões de desenvolvimento para o backend do projeto.

## 1. Idioma do código

- Todo o código deve ser escrito em inglês
- Nomes de variáveis, funções, classes, arquivos, tipos e enums devem estar em inglês
- Mensagens de erro podem ser escritas em português, se isso for o padrão do time

### Exemplo
```ts
const userEmail = 'user@email.com';

function createStudent() {}
```

---

## 2. Convenção de nomes

### Variáveis e funções
- Usar `camelCase`

```ts
const studentEmail = 'student@email.com';

function findStudentById(id: string) {
  return id;
}
```

### Classes, interfaces, DTOs, commands, entities e enums
- Usar `PascalCase`

```ts
class StudentService {}

interface CreateStudentCommand {}

class CreateStudentDto {}

class StudentOrmEntity {}

enum SocialBenefitType {
  BPC = 'BPC',
}
```

### Constantes
- Usar `UPPER_SNAKE_CASE` para constantes globais

```ts
const MAX_LOGIN_ATTEMPTS = 5;
const DEFAULT_PAGE_SIZE = 10;
```

---

## 3. Sufixos de classes e arquivos

- DTOs: `CreateStudentDto`
- Commands: `CreateStudentCommand`
- Services: `StudentService`
- Controllers: `StudentController`
- Repositories: `StudentRepository`
- ORM Entities: `StudentOrmEntity`
- Domain Entities: `Student`
- Exceptions: `StudentNotFoundException`
- Enums: `SocialBenefitType`

---

## 4. Nome de arquivos

- Usar `kebab-case`

### Exemplos
```text
create-student.dto.ts
student.command.ts
student.service.ts
student.controller.ts
student.repository.ts
student.orm-entity.ts
student.entity.ts
student-not-found.exception.ts
social-benefit.enum.ts
student.test.ts
```

---

## 5. Uso de interfaces e types

- Usar `interface` para contratos e estruturas de entrada/saída
- Usar `type` para unions, aliases simples e composições específicas

```ts
export interface CreateContactCommand {
  phone: string;
  city?: string;
}

export type PatchContactCommand = Partial<CreateContactCommand>;
```

---

## 6. Uso de `any`

- O uso de `any` é proibido por padrão
- Exceções devem ser evitadas ao máximo e corrigidas assim que possível

---

## 7. Tipagem de funções

- Retornos de services, repositories, controllers e utilitários principais devem ser explícitos

```ts
async findById(id: string): Promise<Student | null> {
  return null;
}
```

---

## 8. Estrutura de pastas

```text
src/
  adapters/
    in/
      controllers/
      dtos/
    out/
      orm/
      repository/
  core/
    command/
    domain/
    exceptions/
    ports/
    services/
  utils/
```

---

## 9. Controllers

- Controllers devem ser leves
- Não devem conter lógica de negócio
- Devem:
  - receber DTO
  - transformar DTO em command
  - chamar service
  - converter exceptions de domínio em exceptions HTTP

---

## 10. Services

- Concentram a lógica de negócio
- Devem trabalhar com entities de domínio e commands
- Não devem depender diretamente de HTTP
- Devem lançar exceptions de domínio

---

## 11. Repositories

- Implementam interfaces de `core/ports`
- Responsáveis por persistência e mapeamento domínio ↔ ORM

---

## 12. Domain Entities

- Encapsulam regras de negócio
- Usar atributos privados + getters
- Validar no construtor

---

## 13. DTOs e validação

- Validar todas entradas com `class-validator`
- Usar `@ValidateNested()` e `@Type()` para objetos aninhados

---

## 14. Commands

- Representam entrada do caso de uso
- Não possuem lógica

---

## 15. Tratamento de erros

- Exceptions no `core/exceptions`
- Services lançam exceptions
- Controllers traduzem para HTTP

---

## 16. Logger

- Não usar `console.log`

---

## 17. Imports

Ordem:
1. externas
2. internas
3. tipos

---

## 18. Aspas

- Usar aspas simples

---

## 19. Ponto e vírgula

- Sempre usar

---

## 20. Enums

- Usar para valores fechados

---

## 21. Exports

- Preferir named exports

---

## 22. Testes

- Usar `.test.ts`
