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


  @ManyToOne(() => StudentOrmEntity, (student) => student.socialBenefits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: StudentOrmEntity;
}
