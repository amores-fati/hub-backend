import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CompanyOrmEntity } from './company.orm-entity';

@Entity('jobs')
export class JobOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => CompanyOrmEntity)
  @JoinColumn({ name: 'company_id' })
  company: CompanyOrmEntity;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 1 })
  jobs_number: number;

  @Column({ default: false })
  pcd: boolean;
}