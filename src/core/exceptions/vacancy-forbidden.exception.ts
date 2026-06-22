export class VacancyForbiddenException extends Error {
  constructor() {
    super('Você não tem permissão para modificar ou excluir esta vaga.');
    this.name = 'VacancyForbiddenException';
  }
}
