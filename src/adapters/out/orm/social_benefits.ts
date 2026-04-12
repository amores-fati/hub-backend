import { Entity, 
PrimaryGeneratedColumn, 
Column, ManyToOne, 
JoinColumn } from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';

@Entity('social_benefits')
export class SocialBenefitOrmEntity {
    
  @PrimaryGeneratedColumn()
  id: number;

  @Column({})
  student_id: string;

  @ManyToOne(() => StudentOrmEntity, (student) => student.socialBenefits)
  @JoinColumn({})
  student: StudentOrmEntity;

  @Column({ type: 'varchar' })
  benefit: string;

  @Column({ name: 'benefit_other', length: 100, nullable: true })
  benefitOther: string;
}