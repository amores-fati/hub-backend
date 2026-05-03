import { DomainException } from './domain.exception';

export class EnrollmentAlreadyExistsException extends DomainException {
  constructor() {
    super('Você já possui um vínculo com este curso');
    this.name = 'EnrollmentAlreadyExistsException';
  }
}
