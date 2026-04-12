import { Entity, Column, PrimaryColumn, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';
import { ContactOrmEntity } from './contact.orm-entity';
import { DisabilityOrmEntity } from './disability.orm-entity';
import { SocialBenefitOrmEntity } from './social-benefit.orm-entity';
import { AccessibilityResourceOrmEntity } from './accessibility-resource.orm-entity';

@Entity('students')
export class StudentOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 14 })
  cpf!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  socialName!: string | null;

  @Column({ type: 'date', nullable: true })
  birthDate!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  gender!: string | null;

  @Column({ type: 'varchar', nullable: true })
  race!: string | null;

  @Column({ type: 'varchar', nullable: true })
  education!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  courseName!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  institution!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  activityArea!: string | null;

  @Column({ type: 'boolean', nullable: true })
  hasProgrammingExperience!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  hasTechCourses!: boolean | null;

  @Column({ type: 'text', nullable: true })
  techCoursesList!: string | null;

  @Column({ type: 'boolean', default: false })
  sendCurriculum!: boolean;

  @Column({ type: 'text', nullable: true })
  fatilabMotivation!: string | null;

  @Column({ type: 'varchar', nullable: true })
  howHeard!: string | null;

  @Column({ type: 'boolean', nullable: true })
  hasComputer!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  hasInternet!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  committedToParticipate!: boolean | null;

  @OneToOne(() => UserOrmEntity, { cascade: true, eager: true })
  @JoinColumn({ name: 'id' })
  user!: UserOrmEntity;

  @OneToOne(() => ContactOrmEntity, { cascade: true, eager: true })
  @JoinColumn({ name: 'contact_id' })
  contact!: ContactOrmEntity;

  @OneToOne(
  () => DisabilityOrmEntity,
  (disability) => disability.student,
  {
    cascade: true,
    eager: true,
    nullable: true,
  },
)
disability!: DisabilityOrmEntity | null;

  @OneToMany(
    () => SocialBenefitOrmEntity,
    (socialBenefit) => socialBenefit.student,
    {
      cascade: true,
      eager: true,
    },
  )
  socialBenefits!: SocialBenefitOrmEntity[];

  @OneToMany(
    () => AccessibilityResourceOrmEntity,
    (resource) => resource.student,
    {
      cascade: true,
      eager: true,
    },
  )
  accessibilityResources!: AccessibilityResourceOrmEntity[];
}