import { DomainException } from '../exceptions/domain.exception';
import { Contact } from './contact.entity';
import { User } from './user.entity';

export class Company extends User {
  #name: string;
  readonly #cnpj: string;
  #responsibleName: string;
  #contact: Contact;

  constructor(
    id: string,
    email: string,
    password: string,
    name: string,
    cnpj: string,
    responsibleName: string,
    contact: Contact,
  ) {
    super(id, email, password);
    this.#name = name;
    this.#cnpj = cnpj;
    this.#responsibleName = responsibleName;
    this.#contact = contact;
    this.validateCompany();
  }

  get name(): string {
    return this.#name;
  }

  get cnpj(): string {
    return this.#cnpj;
  }

  get responsibleName(): string {
    return this.#responsibleName;
  }

  get contact(): Contact {
    return this.#contact;
  }

  public changeResponsibleName(newResponsibleName: string): void {
    this.validateName(newResponsibleName);
    this.#responsibleName = newResponsibleName;
  }

  public changeName(newName: string): void {
    this.validateName(newName);
    this.#name = newName;
  }

  public changeContact(newContact: Contact): void {
    this.#contact = newContact;
    this.validateContact();
  }

  private validateCompany(): void {
    this.validateCnpj(this.#cnpj);
    this.validateName(this.#responsibleName);
    this.validateName(this.#name);
    this.validateContact();
  }

  private validateCnpj(cnpj: string): void {
    if (!cnpj || cnpj.trim().length === 0) {
      throw new DomainException('O CNPJ Ã© obrigatÃ³rio.');
    }
    if (cnpj.length > 18) {
      throw new DomainException('O CNPJ nÃ£o pode ter mais que 18 caracteres.');
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new DomainException('O nome Ã© obrigatÃ³rio.');
    }
    if (name.length > 100) {
      throw new DomainException(
        'O nome nÃ£o pode ter mais que 100 caracteres.',
      );
    }
  }

  private validateContact(): void {
    if (!this.#contact || !(this.#contact instanceof Contact)) {
      throw new DomainException(
        'Um contato vÃ¡lido e estruturado Ã© obrigatÃ³rio para a empresa.',
      );
    }
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      cnpj: this.cnpj,
      responsibleName: this.responsibleName,
      contact: this.contact,
    };
  }
}
