import { DomainException } from './domain.exception';

export class InvalidResumePhotoException extends DomainException {
  constructor() {
    super('Arquivo de foto invalido.');
    this.name = 'InvalidResumePhotoException';
  }
}
