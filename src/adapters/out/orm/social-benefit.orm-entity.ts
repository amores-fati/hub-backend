import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';
import { SocialBenefitType } from '../../../core/domain/enums/social-benefit.enum';

@Entity('social_benefit')
export class SocialBenefitOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  studentId: string;

  @Column({ type: 'varchar' })
  benefit: SocialBenefitType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  benefitOther: string | null;

  @ManyToOne(
    () => StudentOrmEntity,
    (student) => student.socialBenefits,
  )
  @JoinColumn({ name: 'student_id' })
  student!: StudentOrmEntity;
}