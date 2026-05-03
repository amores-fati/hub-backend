import { DomainException } from './domain.exception';

export class ResumeSkillNotFoundException extends DomainException {
  constructor(skillId: string) {
    super(`Habilidade nao encontrada no curriculo: ${skillId}`);
    this.name = 'ResumeSkillNotFoundException';
  }
}
