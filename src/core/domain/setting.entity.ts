import { DomainException } from '../exceptions/domain.exception';

export class Setting {
  readonly #id: string;
  #key: string;
  #value: string;

  constructor(id: string, key: string, value: string) {
    this.#id = id;
    this.#key = key;
    this.#value = value;
    this.validate();
  }

  get id(): string {
    return this.#id;
  }

  get key(): string {
    return this.#key;
  }

  get value(): string {
    return this.#value;
  }

  private validate(): void {
    if (!this.#id) {
      throw new DomainException('O ID da configuração é obrigatório.');
    }
    if (!this.#key || this.#key.trim().length === 0) {
      throw new DomainException('A chave da configuração é obrigatória.');
    }
    if (this.#value === undefined || this.#value === null) {
      throw new DomainException('O valor da configuração é obrigatório.');
    }
  }

  updateValue(value: string): void {
    this.#value = value;
    this.validate();
  }

  toJSON() {
    return {
      id: this.id,
      key: this.key,
      value: this.value,
    };
  }
}
