import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CompanyOrmEntity } from './company.orm-entity';
import { JobSkillOrmEntity } from './job-skill.orm-entity';

const dateOnlyTransformer = {
  to(value: Date | string | null | undefined): string | null | undefined {
    if (value === null || value === undefined) return value;
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString().slice(0, 10);
  },
  from(value: string | Date | null | undefined): Date | null | undefined {
    if (value === null || value === undefined) return value;
    if (value instanceof Date) return value;
    return new Date(`${value}T00:00:00.000Z`);
  },
};

@Index('ix_job_openings__company_id', ['company'])
@Entity('job_openings')
export class JobOpeningOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CompanyOrmEntity, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'company_id',
    foreignKeyConstraintName: 'fk_job_openings__company_id__companies',
  })
  company: CompanyOrmEntity;

  @OneToMany(() => JobSkillOrmEntity, (jobSkill) => jobSkill.job, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  skills: JobSkillOrmEntity[];

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'openings_count', default: 1 })
  openingsCount: number;

  @Column({
    name: 'application_link',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  applicationLink: string | null;

  @Column({ name: 'is_pcd', default: false })
  isPcd: boolean;

  @Column({
    name: 'workplace_type',
    type: 'varchar',
    length: 100,
    default: 'presencial',
  })
  workplaceType: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({
    name: 'announcement_date',
    type: 'date',
    default: () => 'CURRENT_DATE',
    transformer: dateOnlyTransformer,
  })
  announcementDate: Date;
}
