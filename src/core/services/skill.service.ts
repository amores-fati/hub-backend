import { ISkillRepository } from '../ports/skill.repository.interface';
import { Skill } from '../domain/skill.entity';

export class SkillService {
  constructor(private readonly skillRepository: ISkillRepository) {}

  async getAllSkills(): Promise<Skill[]> {
    return this.skillRepository.findAll();
  }
}
