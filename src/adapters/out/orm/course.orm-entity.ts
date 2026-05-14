import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { CourseStatus } from '../../../core/domain/course-status.enum';

@Check('ck_courses__status', `"status" IN ('ATIVO', 'INATIVO')`)
@Entity('courses')
export class CourseOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  banner: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'course_load' })
  courseLoad: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'start_registrations', type: 'date' })
  startRegistrations: Date;

  @Column({ name: 'end_registrations', type: 'date' })
  endRegistrations: Date;

  @Column({ name: 'modality', type: 'varchar', default: 'ONLINE' })
  modality: string;

  @Column({ name: 'link_access' })
  linkAccess: string;

  @Column({ name: 'vacancy_count', type: 'int', default: 0 })
  vacancyCount: number;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'ATIVO' })
  status: CourseStatus;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  createdAt: Date;
}
