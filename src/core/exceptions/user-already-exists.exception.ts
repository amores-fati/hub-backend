export class UserAlreadyExistsException extends Error {
  constructor(email: string) {
    super(`O usuário com o email ${email} já está cadastrado.`);
    this.name = 'UserAlreadyExistsException';
  }
}
