import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ContactOrmEntity } from './contact.orm-entity';
import { AccessibilityResourceOrmEntity } from './accessibility-resource.orm-entity';
import { SocialBenefitOrmEntity } from './social-benefit.orm-entity';
import { UserOrmEntity } from './user.orm-entity';
import { DisabilityOrmEntity } from './disability.orm-entity';

@Entity('students')
export class StudentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => UserOrmEntity, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  user: UserOrmEntity;

  @OneToOne(() => ContactOrmEntity, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contact_id' })
  contact: ContactOrmEntity;

  @Column({ unique: true })
  cpf: string;

  @Column({ name: 'social_name', type: 'varchar', nullable: true })
  socialName?: string | null;

  @Column({ name: 'date_of_birth', type: 'timestamp', nullable: true })
  birthDate?: Date | null;

  @Column({ type: 'varchar', nullable: true })
  gender?: string | null;

  @Column({ name: 'gender_other', type: 'varchar', nullable: true })
  genderOther?: string | null;

  @Column({ name: 'color', type: 'varchar', nullable: true })
  race: string | null;

  @Column({ type: 'varchar', nullable: true })
  education: string | null;

  @Column({ name: 'course', type: 'varchar', nullable: true })
  courseName: string | null;

  @Column({ type: 'varchar', nullable: true })
  institution: string | null;

  @Column({ name: 'area_activity', type: 'varchar', nullable: true })
  activityArea: string | null;

  @Column({ name: 'programming_exp', type: 'boolean', nullable: true })
  hasProgrammingExperience: boolean | null;

  @Column({ name: 'tecnology_course', type: 'boolean', nullable: true })
  hasTechCourses: boolean | null;

  @Column({ name: 'which_courses', type: 'text', nullable: true })
  techCoursesList: string | null;

  @Column({ name: 'send_curriculum', type: 'boolean', nullable: true })
  sendCurriculum: boolean | null;

  @Column({ name: 'motivation', type: 'text', nullable: true })
  fatilabMotivation: string | null;

  @Column({ name: 'how_know', type: 'varchar', nullable: true })
  howHeard: string | null;

  @Column({ name: 'has_computer', type: 'boolean', nullable: true })
  hasComputer: boolean | null;

  @Column({ name: 'has_internet', type: 'boolean', nullable: true })
  hasInternet: boolean | null;

  @Column({ name: 'compromisse', type: 'boolean', nullable: true })
  committedToParticipate: boolean | null;

  @OneToOne(() => DisabilityOrmEntity, (disability) => disability.student, {
    cascade: true,
  })
  disability: DisabilityOrmEntity | null;

  @OneToMany(
    () => AccessibilityResourceOrmEntity,
    (resource) => resource.student,
    { cascade: true },
  )
  accessibilityResources: AccessibilityResourceOrmEntity[];

  @OneToMany(() => SocialBenefitOrmEntity, (benefit) => benefit.student, {
    cascade: true,
  })
  socialBenefits: SocialBenefitOrmEntity[];
}
