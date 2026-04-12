import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';
import { SocialBenefitType } from '../../../core/domain/enums/social-benefit.enum';

@Entity('social_benefits')
export class SocialBenefitOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ type: 'varchar' })
  benefit: SocialBenefitType;

  @Column({
    name: 'benefit_other',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  benefitOther: string | null;

  @ManyToOne(() => StudentOrmEntity, (student) => student.socialBenefits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: StudentOrmEntity;
}
