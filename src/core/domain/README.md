# Domain (Modelos de Domínio)

O diretório `domain` guarda as Entidades e Objetos de Valor da nossa aplicação. Uma entidade representa um conceito central do negócio, como `Usuario` ou `Curso`.

## Responsabilidades

- Representar o estado e o comportamento das regras de negócio mais fundamentais.
- Garantir que a entidade esteja sempre em um estado válido (autovalidação).

## Boas Práticas

- **Modelos Auto-validáveis:** Coloque as regras de negócio que pertencem à entidade dentro da própria classe. Por exemplo, se um usuário precisa de uma lógica complexa para alterar a senha, crie um método `changePassword()` dentro da classe `User`.
- Construtores devem exigir todos os dados necessários para criar uma entidade válida.

## O que NÃO fazer

- **Modelos Anêmicos:** Evite criar classes que tenham apenas propriedades públicas e nenhum método (apenas getters e setters vazios).
- **Anotações de Banco de Dados:** Não utilize decorators como `@Entity()` ou `@Column()` nestas classes. O domínio não sabe o que é um banco de dados.

### Exemplo

```typescript
// Exemplo de entidade com auto-validação
export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
  ) {}

  public changeName(newName: string): void {
    if (newName.length < 3) throw new Error('O nome é muito curto.');
    this.name = newName;
  }
}
```
