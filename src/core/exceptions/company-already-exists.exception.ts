export class CompanyAlreadyExistsException extends Error {
  constructor(identifier: string) {
    super(`A empresa com o identificador '${identifier}' já está cadastrada.`);
    this.name = 'CompanyAlreadyExistsException';
  }
}
