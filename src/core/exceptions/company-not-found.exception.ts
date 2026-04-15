export class CompanyNotFoundException extends Error {
  constructor(identifier: string) {
    super(`Empresa com o identificador '${identifier}' não foi encontrada.`);
    this.name = 'CompanyNotFoundException';
  }
}
