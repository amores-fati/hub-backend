import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CurriculumOrmEntity } from '../curriculum/curriculum.orm-entity';
import { SkillOrmEntity } from '../skill/skill.orm-entity';

@Entity('skills_curriculum')
export class SkillsCurriculumOrmEntity {
  @PrimaryColumn({ name: 'curriculum_id' })
  curriculum_id: string;  // FK — tipo string

  @PrimaryColumn({ name: 'skill_id' })
  skill_id: string;  // FK — tipo string

  @ManyToOne(() => CurriculumOrmEntity)
  @JoinColumn({ name: 'curriculum_id' })
  curriculum: CurriculumOrmEntity; 

  @ManyToOne(() => SkillOrmEntity)
  @JoinColumn({ name: 'skill_id' })
  skill: SkillOrmEntity;
}