import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CurriculumOrmEntity } from './curriculum.orm-entity';
import { SkillOrmEntity } from '../orm/skill.orm-entity';

@Entity('skills_curriculum')
export class SkillsCurriculumOrmEntity {
  @PrimaryColumn({ name: 'curriculum_id' })
  curriculum_id: string;

  @PrimaryColumn({ name: 'skill_id' })
  skill_id: string;

  @ManyToOne(() => CurriculumOrmEntity)
  @JoinColumn({ name: 'curriculum_id' })
  curriculum: CurriculumOrmEntity;

  @ManyToOne(() => SkillOrmEntity)
  @JoinColumn({ name: 'skill_id' })
  skill: SkillOrmEntity;
}