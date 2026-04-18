import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';

@Entity('curriculum')
export class CurriculumOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => StudentOrmEntity, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'student_id' })
  student: StudentOrmEntity;

  @Column({ name: 'is_available' })
  isAvailable: boolean;

  @Column({ type: 'text', nullable: true })
  about: string;

  @Column()
  linkedin: string;

  @Column()
  github: string;

  @Column({ name: 'profile_photo', nullable: true })
  profilePhoto: string;

  @Column({ name: 'video_presentation' })
  videoPresentation: string;
}
