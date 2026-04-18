import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { CourseOrmEntity } from './course.orm-entity';

@Entity('in_person_course_details')
export class InPersonCourseDetailOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => CourseOrmEntity, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'course_id',
    foreignKeyConstraintName: 'fk_in_person_course_details__course_id__courses',
  })
  course: CourseOrmEntity;

  @Column()
  address: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column()
  shift: string;

  @Column()
  room: string;

  @Column()
  vacancies: number;
}
