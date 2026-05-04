import {
  Check,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { ContactOrmEntity } from './contact.orm-entity';
import { SocialBenefitOrmEntity } from './social-benefit.orm-entity';
import { UserOrmEntity } from './user.orm-entity';
import { DisabilityOrmEntity } from './disability.orm-entity';
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

  @OneToOne(() => ContactOrmEntity, {
    onDelete: 'NO ACTION',
    nullable: false,
  })
  @JoinColumn({
    name: 'contact_id',
    foreignKeyConstraintName: 'fk_students__contact_id__contacts',
  })
  contact: ContactOrmEntity;

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

  @OneToOne(() => DisabilityOrmEntity, (disability) => disability.student)
  disability: DisabilityOrmEntity | null;

  @OneToMany(() => SocialBenefitOrmEntity, (benefit) => benefit.student)
  socialBenefits: SocialBenefitOrmEntity[];
}
