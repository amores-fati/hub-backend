import { DomainException } from './domain.exception';

export class ResumeSkillAlreadyExistsException extends DomainException {
  constructor(skillName: string) {
    super(`Habilidade ja cadastrada no curriculo: ${skillName}`);
    this.name = 'ResumeSkillAlreadyExistsException';
  }
}
