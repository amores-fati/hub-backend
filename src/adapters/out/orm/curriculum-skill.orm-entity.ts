import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CurriculumOrmEntity } from './curriculum.orm-entity';
import { SkillOrmEntity } from './skill.orm-entity';

@Entity('curriculum_skills')
export class CurriculumSkillOrmEntity {
  @PrimaryColumn({ name: 'curriculum_id' })
  curriculumId: string;

  @Index('ix_curriculum_skills__skill_id')
  @PrimaryColumn({ name: 'skill_id' })
  skillId: string;

  @ManyToOne(
    () => CurriculumOrmEntity,
    (curriculum) => curriculum.curriculumSkills,
  )
  @JoinColumn({
    name: 'curriculum_id',
    foreignKeyConstraintName: 'fk_curriculum_skills__curriculum_id__curriculum',
  })
  curriculum: CurriculumOrmEntity;

  @ManyToOne(() => SkillOrmEntity)
  @JoinColumn({
    name: 'skill_id',
    foreignKeyConstraintName: 'fk_curriculum_skills__skill_id__skills',
  })
  skill: SkillOrmEntity;
}
