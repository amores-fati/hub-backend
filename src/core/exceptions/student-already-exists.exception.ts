export class StudentAlreadyExistsException extends Error {
  constructor(identifier: string) {
    super(`Aluno com identificador ${identifier} já está cadastrado.`);
    this.name = 'StudentAlreadyExistsException';
  }
}