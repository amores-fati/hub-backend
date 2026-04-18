import { DomainException } from '../exceptions/domain.exception';

export abstract class User {
  readonly #id: string;
  #email: string;
  #password: string;

  constructor(id: string, email: string, password: string) {
    this.#id = id;
    this.#email = email;
    this.#password = password;
    this.validateUser();
  }

  get id(): string {
    return this.#id;
  }

  get email(): string {
    return this.#email;
  }

  get password(): string {
    return this.#password;
  }

  public changeEmail(newEmail: string): void {
    this.validateEmail(newEmail);
    this.#email = newEmail;
  }

  public changePassword(newPassword: string): void {
    this.validatePassword(newPassword);
    this.#password = newPassword;
  }

  private validateUser(): void {
    this.validateEmail(this.#email);
    this.validatePassword(this.#password);
  }

  private validatePassword(password: string): void {
    if (!password || password.trim().length === 0) {
      throw new DomainException('A senha Ã© obrigatÃ³ria.');
    }
    if (password.length > 100) {
      throw new DomainException(
        'A senha nÃ£o pode ter mais que 100 caracteres.',
      );
    }
  }

  private validateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new DomainException('O e-mail Ã© obrigatÃ³rio.');
    }
    if (email.length > 100) {
      throw new DomainException(
        'O e-mail nÃ£o pode ter mais que 100 caracteres.',
      );
    }
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
    };
  }
}
