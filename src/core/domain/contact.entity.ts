import { DomainException } from '../exceptions/domain.exception';

export class Contact {
  constructor(
    private readonly _id: string,
    private _phone: string,
    private _neighbourhood?: string,
    private _state?: string,
    private _city?: string,
    private _address?: string,
    private _cep?: string,
    private _complement?: string,
  ) {
    this.validateContact();
  }

  get id(): string {
    return this._id;
  }
  get phone(): string {
    return this._phone;
  }
  get neighbourhood(): string | undefined {
    return this._neighbourhood;
  }
  get state(): string | undefined {
    return this._state;
  }
  get city(): string | undefined {
    return this._city;
  }
  get address(): string | undefined {
    return this._address;
  }
  get cep(): string | undefined {
    return this._cep;
  }
  get complement(): string | undefined {
    return this._complement;
  }

  public changePhone(newPhone: string): void {
    this.validatePhone(newPhone);
    this._phone = newPhone;
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

    if (data.neighbourhood !== undefined)
      this._neighbourhood = data.neighbourhood;
    if (data.state !== undefined) this._state = data.state;
    if (data.city !== undefined) this._city = data.city;
    if (data.address !== undefined) this._address = data.address;
    if (data.cep !== undefined) this._cep = data.cep;
    if (data.complement !== undefined) this._complement = data.complement;
  }

  private validateContact(): void {
    this.validatePhone(this._phone);
    if (this._state) this.validateState(this._state);
    if (this._cep) this.validateCep(this._cep);
  }

  private validatePhone(phone: string): void {
    if (!phone || phone.trim().length === 0) {
      throw new DomainException('O telefone é obrigatório.');
    }
    if (phone.length > 20) {
      throw new DomainException(
        'O telefone não pode ter mais que 20 caracteres.',
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
      throw new DomainException('O CEP não pode ter mais que 9 caracteres.');
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
