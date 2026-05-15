import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';
import { SocialBenefitOrmEntity } from './social-benefit.orm-entity';

@Entity('student_social_benefit')
export class StudentSocialBenefitOrmEntity {
  @PrimaryColumn('uuid')
  studentId: string;

  @PrimaryColumn('uuid')
  socialBenefitId: string;

  @ManyToOne(() => StudentOrmEntity, (student) => student.socialBenefits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'fk_student_social_benefit__student_id__students',
  })
  student: StudentOrmEntity;

  @ManyToOne(() => SocialBenefitOrmEntity, (benefit) => benefit.students, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'social_benefit_id',
    foreignKeyConstraintName: 'fk_student_social_benefit__social_benefit_id__social_benefits',
  })
  socialBenefit: SocialBenefitOrmEntity;
}