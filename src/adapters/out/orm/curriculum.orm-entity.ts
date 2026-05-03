import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';
import { CurriculumSkillOrmEntity } from './curriculum-skill.orm-entity';

@Entity('curriculum')
export class CurriculumOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => StudentOrmEntity, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'fk_curriculum__student_id__students',
  })
  student: StudentOrmEntity;

  @Column({ name: 'is_available' })
  isAvailable: boolean;

  @Column({ type: 'text', nullable: true })
  about: string | null;

  @Column({ type: 'varchar', nullable: true })
  linkedin: string | null;

  @Column({ type: 'varchar', nullable: true })
  github: string | null;

  @Column({ name: 'profile_photo', type: 'varchar', nullable: true })
  profilePhoto: string | null;

  @Column({ name: 'video_presentation', type: 'varchar', nullable: true })
  videoPresentation: string | null;

  @OneToMany(
    () => CurriculumSkillOrmEntity,
    (curriculumSkill) => curriculumSkill.curriculum,
  )
  curriculumSkills: CurriculumSkillOrmEntity[];
}
