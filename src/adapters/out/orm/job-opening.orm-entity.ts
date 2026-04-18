import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CompanyOrmEntity } from './company.orm-entity';

@Entity('job_openings')
export class JobOpeningOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CompanyOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
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
}
