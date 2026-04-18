import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { JobOpeningOrmEntity } from './job-opening.orm-entity';
import { SkillOrmEntity } from './skill.orm-entity';

@Entity('job_skills')
export class JobSkillOrmEntity {
  @PrimaryColumn({ name: 'job_id' })
  jobId: string;

  @Index('ix_job_skills__skill_id')
  @PrimaryColumn({ name: 'skill_id' })
  skillId: string;

  @ManyToOne(() => JobOpeningOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'job_id',
    foreignKeyConstraintName: 'fk_job_skills__job_id__job_openings',
  })
  job: JobOpeningOrmEntity;

  @ManyToOne(() => SkillOrmEntity)
  @JoinColumn({
    name: 'skill_id',
    foreignKeyConstraintName: 'fk_job_skills__skill_id__skills',
  })
  skill: SkillOrmEntity;
}
