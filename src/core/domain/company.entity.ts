import { DomainException } from '../exceptions/domain.exception';
import { Contact } from './contact.entity';
import { UserRoleEnum } from './user-role.enum';
import { User } from './user.entity';

export class Company extends User {
  constructor(
    id: string,
    email: string,
    password: string,
    private _name: string,
    private readonly _cnpj: string,
    private _ownerName: string,
    private _contact: Contact,
  ) {
    super(id, email, password, UserRoleEnum.COMPANY);
    this.validateCompany();
  }

  get name(): string {
    return this._name;
  }
  get cnpj(): string {
    return this._cnpj;
  }
  get ownerName(): string {
    return this._ownerName;
  }
  get contact(): Contact {
    return this._contact;
  }

  public changeOwnerName(newOwnerName: string): void {
    this.validateName(newOwnerName);
    this._ownerName = newOwnerName;
  }

  public changeName(newName: string): void {
    this.validateName(newName);
    this._name = newName;
  }

  public changeContact(newContact: Contact): void {
    this._contact = newContact;
    this.validateContact();
  }

  private validateCompany(): void {
    this.validateCnpj(this._cnpj);
    this.validateName(this._ownerName);
    this.validateName(this._name);
    this.validateContact();
  }

  private validateCnpj(cnpj: string): void {
    if (!cnpj || cnpj.trim().length === 0) {
      throw new DomainException('O CNPJ é obrigatório.');
    }
    if (cnpj.length > 18) {
      throw new DomainException('O CNPJ não pode ter mais que 18 caracteres.');
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new DomainException('O nome é obrigatório.');
    }
    if (name.length > 100) {
      throw new DomainException('O nome não pode ter mais que 100 caracteres.');
    }
  }

  private validateContact(): void {
    if (!this._contact || !(this._contact instanceof Contact)) {
      throw new DomainException(
        'Um contato válido e estruturado é obrigatório para a empresa.',
      );
    }
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      cnpj: this.cnpj,
      ownerName: this.ownerName,
      contact: this.contact,
      role: this.role,
    };
  }
}
