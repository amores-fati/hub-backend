import {
  Column,
  Entity,
  PrimaryColumn,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';

@Entity('social_benefit')
export class SocialBenefitOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'NOW()',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'NOW()',
  })
  updatedAt: Date;

  @ManyToMany(() => StudentOrmEntity, (student) => student.socialBenefits)
  students: StudentOrmEntity[];
}
