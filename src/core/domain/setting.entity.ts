import { DomainException } from '../exceptions/domain.exception';

export class Setting {
  readonly #key: string;
  #value: string;

  constructor(key: string, value: string) {
    this.#key = key;
    this.#value = value;
    this.validateSetting();
  }

  get key(): string {
    return this.#key;
  }

  get value(): string {
    return this.#value;
  }

  private validateSetting(): void {
    if (!this.#key || this.#key.trim().length === 0) {
      throw new DomainException('A chave da configuracao e obrigatoria.');
    }

    if (this.#value === undefined || this.#value === null) {
      throw new DomainException('O valor da configuracao e obrigatorio.');
    }
  }

  toJSON() {
    return {
      key: this.key,
      value: this.value,
    };
  }
}
