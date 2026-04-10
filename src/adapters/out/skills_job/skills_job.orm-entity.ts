import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { JobOrmEntity } from '../jobs/jobs.orm-entity';
import { SkillOrmEntity } from '../skill/skill.orm-entity';

@Entity('skills_job')
export class SkillsJobOrmEntity {
  @PrimaryColumn({ name: 'job_id' })
  job_id: string;

  @PrimaryColumn({ name: 'skill_id' })
  skill_id: string;

  @ManyToOne(() => JobOrmEntity)
  @JoinColumn({ name: 'job_id' })
  job: JobOrmEntity;

  @ManyToOne(() => SkillOrmEntity)
  @JoinColumn({ name: 'skill_id' })
  skill: SkillOrmEntity;
}