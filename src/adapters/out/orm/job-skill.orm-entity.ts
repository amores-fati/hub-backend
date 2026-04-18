import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { JobOpeningOrmEntity } from './job-opening.orm-entity';
import { SkillOrmEntity } from './skill.orm-entity';

@Entity('job_skills')
export class JobSkillOrmEntity {
  @PrimaryColumn({ name: 'job_id' })
  jobId: string;

  @PrimaryColumn({ name: 'skill_id' })
  skillId: string;

  @ManyToOne(() => JobOpeningOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: JobOpeningOrmEntity;

  @ManyToOne(() => SkillOrmEntity)
  @JoinColumn({ name: 'skill_id' })
  skill: SkillOrmEntity;
}
