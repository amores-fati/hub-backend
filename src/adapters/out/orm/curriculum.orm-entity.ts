import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';

@Entity('curriculums')
export class CurriculumOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => StudentOrmEntity, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: StudentOrmEntity;

  @Column()
  is_avaliable: boolean;

  @Column({ type: 'text', nullable: true })
  about: string;

  @Column()
  linkedin: string;

  @Column()
  github: string;

  @Column({ nullable: true })
  profile_photo: string;

  @Column()
  video_apresentation: string;
}
