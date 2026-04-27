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
  description: string;

  @Column()
  course_load: string;

  @Column()
  start_date: Date;

  @Column()
  end_date: Date;

  @Column()
  start_registrations: Date;

  @Column()
  end_registrations: Date;

  @Column()
  link_access: string;
}
