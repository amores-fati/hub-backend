import{
    Entity,
    Column,
    PrimaryColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { CourseOrmEntity } from './course.orm-entity';

@Entity('person_courses')
export class PersonCourseOrmEntity {
    
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => CourseOrmEntity, { cascade: true, onDelete: 'CASCADE' })   
  @JoinColumn()
  course: CourseOrmEntity; 

  @Column()
  adress: string;
  
  @Column()
  start_date: Date;

  @Column()
  shift: string;

  @Column()
  room: string;

  @Column()
  vacancies: number;
}