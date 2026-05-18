import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CompanyOrmEntity } from './company.orm-entity';

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
    length: 20,
    default: 'presential',
  })
  workplaceType: string;
}
