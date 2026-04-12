import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';

@Entity('social_benefits')
export class SocialBenefitOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => StudentOrmEntity, (student) => student.socialBenefits)
  @JoinColumn({ name: 'student_id' })
  student: StudentOrmEntity;

  @Column({ type: 'varchar' })
  benefit: string;

  @Column({ name: 'benefit_other', length: 100, nullable: true })
  benefitOther: string;
}
