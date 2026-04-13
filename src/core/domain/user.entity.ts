import { DomainException } from '../exceptions/domain.exception';
import { UserRoleEnum } from './enums/user-role.enum';

export abstract class User {
  constructor(
    protected readonly _id: string,
    protected _email: string,
    protected _password: string,
    protected readonly _role: UserRoleEnum,
  ) {
    this.validateUser();
  }

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get role(): string {
    return this._role;
  }

  get password(): string {
    return this._password;
  }

  public changeEmail(newEmail: string): void {
    this.validateEmail(newEmail);
    this._email = newEmail;
  }

  public changePassword(newPassword: string): void {
    this.validatePassword(newPassword);
    this._password = newPassword;
  }

  private validateUser(): void {
    this.validateEmail(this._email);
    this.validatePassword(this._password);
  }

  private validatePassword(password: string): void {
    if (!password || password.trim().length === 0) {
      throw new DomainException('A senha é obrigatória.');
    }
    if (password.length > 100) {
      throw new DomainException(
        'A senha não pode ter mais que 100 caracteres.',
      );
    }
  }

  private validateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new DomainException('O e-mail é obrigatório.');
    }
    if (email.length > 100) {
      throw new DomainException(
        'O e-mail não pode ter mais que 100 caracteres.',
      );
    }
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
    };
  }
}
