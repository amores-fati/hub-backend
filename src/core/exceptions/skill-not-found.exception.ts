import { DomainException } from './domain.exception';

export class SkillNotFoundException extends DomainException {
  constructor(skillName: string) {
    super(`A habilidade "${skillName}" nao esta disponivel no catalogo.`);
    this.name = 'SkillNotFoundException';
  }
}
