export class InvalidPasswordResetTokenException extends Error {
  constructor() {
    super('Token invalido ou expirado.');
    this.name = 'InvalidPasswordResetTokenException';
  }
}
