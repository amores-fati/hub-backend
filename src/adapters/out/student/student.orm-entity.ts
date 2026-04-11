import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('students')
export class StudentOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  socialName!: string | null;

  @Column({ type: 'varchar' })
  cpf!: string;

  @Column({ type: 'timestamp' })
  birthDate!: Date;

  @Column({ type: 'varchar' })
  phone!: string;

  @Column({ type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar' })
  password!: string;

  @Column({ type: 'varchar' })
  gender!: string;

  @Column({ type: 'varchar' })
  race!: string;

  @Column({ type: 'varchar', nullable: true })
  cep!: string | null;

  @Column({ type: 'varchar', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', nullable: true })
  complement!: string | null;

  @Column({ type: 'varchar', nullable: true })
  neighborhood!: string | null;

  @Column({ type: 'varchar', nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', nullable: true })
  state!: string | null;

  @Column({ type: 'varchar' })
  education!: string;

  @Column({ type: 'varchar', nullable: true })
  courseName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  institution!: string | null;

  @Column({ type: 'text' })
  fatilabMotivation!: string;

  @Column({ type: 'varchar', nullable: true })
  howHeard!: string | null;

  @Column({ type: 'boolean', nullable: true })
  hasComputer!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  hasInternet!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  committedToParticipate!: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  familyIncome!: string | null;

  @Column({ type: 'int', nullable: true })
  householdSize!: number | null;

  @Column({ type: 'varchar', nullable: true })
  socialBenefits!: string | null;

  @Column({ type: 'boolean', nullable: true })
  hasProgrammingExperience!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  hasTechCourses!: boolean | null;

  @Column({ type: 'text', nullable: true })
  techCoursesList!: string | null;

  @Column({ type: 'boolean', nullable: true })
  isEmployed!: boolean | null;

  @Column({ type: 'varchar', nullable: true })
  workArea!: string | null;

  @Column({ type: 'boolean' })
  isPcd!: boolean;

  @Column({ type: 'varchar', nullable: true })
  disabilityType!: string | null;

  @Column({ type: 'text', nullable: true })
  disabilityDescription!: string | null;

  @Column({ type: 'varchar', nullable: true })
  hasMedicalReport!: string | null;

  @Column({ type: 'varchar', nullable: true })
  accessibilityResources!: string | null;

  @Column({ type: 'text', nullable: true })
  specificAccessibilityNeeds!: string | null;

  @Column({ type: 'boolean' })
  authorizesImageUse!: boolean;

  @Column({ type: 'boolean' })
  acceptsLgpd!: boolean;

  @Column({ type: 'boolean', default: false })
  sendCurriculum!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}