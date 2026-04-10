import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ContactOrmEntity } from '../contact/contact.orm-entity';

@Entity('students')
export class StudentOrmEntity {

  @PrimaryColumn('uuid')
  id: string;   

  @OneToOne(() => ContactOrmEntity, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  contact: ContactOrmEntity;

  @Column()
  cpf: string;

  @Column({ nullable: true })
  social_name: string;

  @Column({ nullable: true })
  date_of_birth: Date;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  gender_other: string;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  education: string;
  
  @Column({ nullable: true })
  course: string;

  @Column({ nullable: true })
  institution: string;

  @Column({ nullable: true })
  area_activity: string;

  @Column({ nullable: true })
  programming_exp: boolean;

  @Column({ nullable: true })
  tecnology_course: boolean

  @Column({ type: 'text', nullable: true })
  which_courses: string;

  @Column({ nullable: true })
  send_curriculum: boolean;
  
  @Column({ type: 'text', nullable: true })
  motivation: string;

  @Column({ nullable: true })
  how_know: string;

  @Column({ nullable: true })
  has_computer: boolean;
  
  @Column({ nullable: true })
  has_internet: boolean;

  @Column({ nullable: true })
  compromisse: boolean;

}
