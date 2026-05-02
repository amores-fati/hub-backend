import { DomainException } from './domain.exception';

export class InvalidResumeUrlException extends DomainException {
  constructor(field: string) {
    super(`URL invalida para o campo ${field}.`);
    this.name = 'InvalidResumeUrlException';
  }
}
