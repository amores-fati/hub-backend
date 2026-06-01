import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { CourseOrmEntity } from './course.orm-entity';
import { StudentOrmEntity } from './student.orm-entity';

@Check('ck_enrollments__type', `"type" IN ('ENROLLMENT', 'INTEREST')`)
@Unique('uq_enrollments__student_id__course_id__type', [
  'studentId',
  'courseId',
  'type',
])
@Index('ix_enrollments__student_id', ['studentId'])
@Entity('enrollments')
export class EnrollmentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => StudentOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'fk_enrollments__student_id__students',
  })
  student: StudentOrmEntity;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @ManyToOne(() => CourseOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'course_id',
    foreignKeyConstraintName: 'fk_enrollments__course_id__courses',
  })
  course: CourseOrmEntity;

  @Column({ name: 'type', type: 'varchar', length: 20 })
  type: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  createdAt: Date;
}
