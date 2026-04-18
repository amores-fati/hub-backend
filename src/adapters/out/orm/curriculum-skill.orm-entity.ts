import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CurriculumOrmEntity } from './curriculum.orm-entity';
import { SkillOrmEntity } from './skill.orm-entity';

@Entity('curriculum_skills')
export class CurriculumSkillOrmEntity {
  @PrimaryColumn({ name: 'curriculum_id' })
  curriculumId: string;

  @PrimaryColumn({ name: 'skill_id' })
  skillId: string;

  @ManyToOne(() => CurriculumOrmEntity)
  @JoinColumn({ name: 'curriculum_id' })
  curriculum: CurriculumOrmEntity;

  @ManyToOne(() => SkillOrmEntity)
  @JoinColumn({ name: 'skill_id' })
  skill: SkillOrmEntity;
}
