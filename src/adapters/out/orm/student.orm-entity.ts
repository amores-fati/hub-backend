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
import {
  EducationLevel,
  Gender,
  HowHeardChannel,
  Race,
} from '../../../core/domain/enums/student-profile.enum';

@Entity('students')
export class StudentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  user: UserOrmEntity;

  @OneToOne(() => ContactOrmEntity, {
    onDelete: 'NO ACTION',
    nullable: false,
  })
  @JoinColumn({ name: 'contact_id' })
  contact: ContactOrmEntity;

  @Column({ unique: true })
  cpf: string;


  @Column({ name: 'date_of_birth', type: 'date' })
  birthDate: Date;

  @Column({ type: 'varchar' })
  gender: Gender;

  @Column({ name: 'race', type: 'varchar' })
  race: Race;

  @Column({ type: 'varchar', nullable: true })
  education: EducationLevel | null;


  @Column({ type: 'varchar', nullable: true })
  institution: string | null;

  @Column({ name: 'activity_area', type: 'varchar', nullable: true })
  activityArea: string | null;

  @Column({
    name: 'has_programming_experience',
    type: 'boolean',
    nullable: true,
  })
  hasProgrammingExperience: boolean | null;

  @Column({ name: 'has_technology_course', type: 'boolean', nullable: true })
  hasTechnologyCourse: boolean | null;


  @Column({
    name: 'send_curriculum',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  sendCurriculum: boolean | null;

  @Column({ name: 'motivation', type: 'text', nullable: true })
  motivation: string | null;

  @Column({ name: 'how_heard', type: 'varchar', nullable: true })
  howHeard: HowHeardChannel | null;

  @Column({ name: 'has_computer', type: 'boolean', nullable: true })
  hasComputer: boolean | null;

  @Column({ name: 'has_internet', type: 'boolean', nullable: true })
  hasInternet: boolean | null;

  @Column({
    name: 'committed_to_participate',
    type: 'boolean',
    nullable: true,
  })
  committedToParticipate: boolean | null;

  @OneToOne(() => DisabilityOrmEntity, (disability) => disability.student)
  disability: DisabilityOrmEntity | null;

  @OneToMany(
    () => AccessibilityResourceOrmEntity,
    (resource) => resource.student,
  )
  accessibilityResources: AccessibilityResourceOrmEntity[];

  @OneToMany(() => SocialBenefitOrmEntity, (benefit) => benefit.student)
  socialBenefits: SocialBenefitOrmEntity[];
}
