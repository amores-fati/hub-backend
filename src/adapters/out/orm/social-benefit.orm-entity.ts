import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';
import { SocialBenefitType } from '../../../core/domain/enums/social-benefit.enum';

const SOCIAL_BENEFIT_SQL = Object.values(SocialBenefitType)
  .map((value) => `'${value.replace(/'/g, "''")}'`)
  .join(', ');

@Check('ck_social_benefits__benefit', `"benefit" IN (${SOCIAL_BENEFIT_SQL})`)
@Entity('social_benefits')
export class SocialBenefitOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('ix_social_benefits__student_id')
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ type: 'varchar' })
  benefit: SocialBenefitType;

  @ManyToOne(() => StudentOrmEntity, (student) => student.socialBenefits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'fk_social_benefits__student_id__students',
  })
  student: StudentOrmEntity;
}
