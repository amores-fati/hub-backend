import { DomainException } from './domain.exception';

export class EmptyResumeSkillNameException extends DomainException {
  constructor() {
    super('O nome da habilidade e obrigatorio.');
    this.name = 'EmptyResumeSkillNameException';
  }
}
