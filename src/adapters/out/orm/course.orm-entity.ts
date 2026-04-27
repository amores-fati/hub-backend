import { Entity, Column, PrimaryColumn } from 'typeorm';

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

  @Column({ name: 'link_access' })
  linkAccess: string;
}
