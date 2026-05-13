import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('admin_courses')
export class AdminCourseOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  modality: string;

  @Column()
  shift: string;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ name: 'vacancy_count', type: 'int', nullable: true })
  vacancyCount: number | null;

  @Column({ name: 'workload_hours', type: 'int', nullable: true })
  workloadHours: number | null;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ name: 'enrollment_start', type: 'date', nullable: true })
  enrollmentStart: Date | null;

  @Column({ name: 'enrollment_end', type: 'date', nullable: true })
  enrollmentEnd: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  createdAt: Date;
}
