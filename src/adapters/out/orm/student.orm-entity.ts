import {
  Check,
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { SocialBenefitOrmEntity } from './social-benefit.orm-entity';
import { UserOrmEntity } from './user.orm-entity';
import { DisabilityOrmEntity } from './disability.orm-entity';
import { TelephoneStudentOrmEntity } from './telephone-student.orm-entity';
import { AddressStudentOrmEntity } from './address-student.orm-entity';
import {
  EducationLevel,
  Gender,
  HowHeardChannel,
  Race,
  FamilyIncome,
} from '../../../core/domain/enums/student-profile.enum';

function toSqlList(values: string[]): string {
  return values.map((value) => `'${value.replace(/'/g, "''")}'`).join(', ');
}

const dateOnlyTransformer = {
  to(value: Date | string | null | undefined): string | null | undefined {
    if (value === null || value === undefined) return value;
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString().slice(0, 10);
  },
  from(value: string | Date | null | undefined): Date | null | undefined {
    if (value === null || value === undefined) return value;
    if (value instanceof Date) return value;
    return new Date(`${value}T00:00:00.000Z`);
  },
};

const GENDER_SQL = toSqlList(Object.values(Gender));
const RACE_SQL = toSqlList(Object.values(Race));
const EDUCATION_SQL = toSqlList(Object.values(EducationLevel));
const HOW_HEARD_SQL = toSqlList(Object.values(HowHeardChannel));
const FAMILY_INCOME_SQL = toSqlList(Object.values(FamilyIncome));

@Check('ck_students__gender', `"gender" IN (${GENDER_SQL})`)
@Check('ck_students__race', `"race" IN (${RACE_SQL})`)
@Check(
  'ck_students__education',
  `"education" IS NULL OR "education" IN (${EDUCATION_SQL})`,
)
@Check(
  'ck_students__how_heard',
  `"how_heard" IS NULL OR "how_heard" IN (${HOW_HEARD_SQL})`,
)
@Check(
  'ck_students__family_income',
  `"family_income" IS NULL OR "family_income" IN (${FAMILY_INCOME_SQL})`,
)
@Entity('students')
export class StudentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'id',
    foreignKeyConstraintName: 'fk_students__id__users',
  })
  user: UserOrmEntity;

  @OneToOne(() => TelephoneStudentOrmEntity, (t) => t.student, {
    cascade: true,
    eager: false,
  })
  telephone: TelephoneStudentOrmEntity;

  @OneToOne(() => AddressStudentOrmEntity, (a) => a.student, {
    cascade: true,
    eager: false,
  })
  address: AddressStudentOrmEntity;

  @Column({ unique: true })
  cpf: string;

  @Column({ name: 'full_name', type: 'varchar' })
  fullName: string;

  @Column({ name: 'social_name', type: 'varchar', nullable: true })
  socialName: string | null;

  @Column({
    name: 'date_of_birth',
    type: 'date',
    transformer: dateOnlyTransformer,
  })
  birthDate: Date;

  @Column({ type: 'varchar' })
  gender: Gender;

  @Column({ name: 'race', type: 'varchar' })
  race: Race;

  @Column({ type: 'varchar', nullable: true })
  education: EducationLevel | null;

  @Column({ name: 'course_name', type: 'varchar', nullable: true })
  courseName: string | null;

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

  @Column({ name: 'family_income', type: 'varchar', nullable: true })
  familyIncome: FamilyIncome | null;

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

  @Column({ name: 'household_size', type: 'int', nullable: true })
  householdSize: number | null;

  @ManyToMany(() => DisabilityOrmEntity, (disability) => disability.students)
  @JoinTable({
    name: 'student_disability',
    joinColumn: {
      name: 'student_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'disability_id',
      referencedColumnName: 'id',
    },
  })
  disabilities: DisabilityOrmEntity[];

  @ManyToMany(() => SocialBenefitOrmEntity, (benefit) => benefit.students)
  @JoinTable({
    name: 'student_social_benefit',
    joinColumn: {
      name: 'student_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'social_benefit_id',
      referencedColumnName: 'id',
    },
  })
  socialBenefits: SocialBenefitOrmEntity[];
}
