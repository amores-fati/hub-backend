import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('enrollments')
export class EnrollmentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @Column({ name: 'type', type: 'varchar', length: 20 })
  type: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  createdAt: Date;
}
