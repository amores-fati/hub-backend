export class VacancyNotFoundException extends Error {
  constructor(identifier?: string) {
    super(
      identifier
        ? `Vaga com o identificador '${identifier}' não foi encontrada.`
        : 'Vaga não encontrada',
    );
    this.name = 'VacancyNotFoundException';
  }
}
