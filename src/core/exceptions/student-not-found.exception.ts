import { DomainException } from './domain.exception';

export class StudentNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(`Aluno não encontrado pelo o identificador: ${identifier}`);
    this.name = 'StudentNotFoundException';
  }
}
