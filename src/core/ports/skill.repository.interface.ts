import { Skill } from '../domain/skill.entity';

export const ISkillRepository = Symbol('ISkillRepository');

export interface ISkillRepository {
  findAll(): Promise<Skill[]>;
}
