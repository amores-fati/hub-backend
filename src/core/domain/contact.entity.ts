import { DomainException } from '../exceptions/domain.exception';

export class Contact {
  readonly #id: string;
  #phone: string;
  #neighbourhood?: string;
  #state?: string;
  #city?: string;
  #address?: string;
  #cep?: string;
  #complement?: string;

  constructor(
    id: string,
    phone: string,
    neighbourhood?: string,
    state?: string,
    city?: string,
    address?: string,
    cep?: string,
    complement?: string,
  ) {
    this.#id = id;
    this.#phone = phone;
    this.#neighbourhood = neighbourhood;
    this.#state = state;
    this.#city = city;
    this.#address = address;
    this.#cep = cep;
    this.#complement = complement;
    this.validateContact();
  }

  get id(): string {
    return this.#id;
  }
  get phone(): string {
    return this.#phone;
  }
  get neighbourhood(): string | undefined {
    return this.#neighbourhood;
  }
  get state(): string | undefined {
    return this.#state;
  }
  get city(): string | undefined {
    return this.#city;
  }
  get address(): string | undefined {
    return this.#address;
  }
  get cep(): string | undefined {
    return this.#cep;
  }
  get complement(): string | undefined {
    return this.#complement;
  }

  public changePhone(newPhone: string): void {
    this.validatePhone(newPhone);
    this.#phone = newPhone;
  }

  public changeAddress(data: {
    neighbourhood?: string;
    state?: string;
    city?: string;
    address?: string;
    cep?: string;
    complement?: string;
  }): void {
    if (data.state !== undefined) this.validateState(data.state);
    if (data.cep !== undefined) this.validateCep(data.cep);

    if (data.neighbourhood !== undefined) {
      this.#neighbourhood = data.neighbourhood;
    }
    if (data.state !== undefined) this.#state = data.state;
    if (data.city !== undefined) this.#city = data.city;
    if (data.address !== undefined) this.#address = data.address;
    if (data.cep !== undefined) this.#cep = data.cep;
    if (data.complement !== undefined) this.#complement = data.complement;
  }

  private validateContact(): void {
    this.validatePhone(this.#phone);
    if (this.#state) this.validateState(this.#state);
    if (this.#cep) this.validateCep(this.#cep);
  }

  private validatePhone(phone: string): void {
    if (!phone || phone.trim().length === 0) {
      throw new DomainException('O telefone Ã© obrigatÃ³rio.');
    }
    if (phone.length > 20) {
      throw new DomainException(
        'O telefone nÃ£o pode ter mais que 20 caracteres.',
      );
    }
  }

  private validateState(state: string): void {
    if (state.length !== 2) {
      throw new DomainException(
        'O estado deve ser a sigla com exatamente 2 caracteres.',
      );
    }
  }

  private validateCep(cep: string): void {
    if (cep.length > 9) {
      throw new DomainException('O CEP nÃ£o pode ter mais que 9 caracteres.');
    }
  }

  toJSON() {
    return {
      id: this.id,
      phone: this.phone,
      neighbourhood: this.neighbourhood,
      state: this.state,
      city: this.city,
      address: this.address,
      cep: this.cep,
      complement: this.complement,
    };
  }
}
