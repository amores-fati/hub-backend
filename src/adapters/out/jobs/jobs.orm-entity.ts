import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { EnterpriseOrmEntity } from '../enterprise/enterprise.orm-entity';

@Entity('jobs')
export class JobOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'enterprise_id' })
  enterpriseId: string;

  @ManyToOne(() => EnterpriseOrmEntity)
  @JoinColumn({ name: 'enterprise_id' })
  enterprise: EnterpriseOrmEntity;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 1 })
  jobs_number: number;

  @Column({ default: false })
  pcd: boolean;
}