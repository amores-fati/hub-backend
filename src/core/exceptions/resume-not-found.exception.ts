import { DomainException } from './domain.exception';

export class ResumeNotFoundException extends DomainException {
  constructor(studentId: string) {
    super(`Curriculo nao encontrado para o aluno: ${studentId}`);
    this.name = 'ResumeNotFoundException';
  }
}
