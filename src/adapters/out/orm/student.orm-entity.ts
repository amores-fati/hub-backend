import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ContactOrmEntity } from './contact.orm-entity';
import { AccessibilityResourceOrmEntity } from './accessibility_resourses.orm-entity';
import { SocialBenefitOrmEntity } from './social_benefits';
import { UserOrmEntity } from './user.orm-entity';

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
  tecnology_course: boolean;

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

  @OneToMany(
    () => AccessibilityResourceOrmEntity,
    (resource) => resource.student,
  )
  accessibilityResources: AccessibilityResourceOrmEntity[];

  @OneToMany(() => SocialBenefitOrmEntity, (benefit) => benefit.student)
  socialBenefits: SocialBenefitOrmEntity[];
}
