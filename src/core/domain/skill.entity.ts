import { DomainException } from '../exceptions/domain.exception';

export class Skill {
  readonly #id: string;
  readonly #name: string;

  constructor(id: string, name: string) {
    this.#id = id;
    this.#name = name;
    this.validate();
  }

  get id(): string {
    return this.#id;
  }

  get name(): string {
    return this.#name;
  }

  private validate(): void {
    if (!this.#id || this.#id.trim().length === 0) {
      throw new DomainException('O id da habilidade é obrigatório.');
    }
    if (!this.#name || this.#name.trim().length === 0) {
      throw new DomainException('O nome da habilidade é obrigatório.');
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
    };
  }
}
