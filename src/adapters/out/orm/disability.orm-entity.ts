import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryColumn,
} from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';

@Entity('disabilities')
export class DisabilityOrmEntity {

  @PrimaryColumn({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @OneToOne(() => StudentOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: StudentOrmEntity;

  @Column({ name: 'has_disability', default: false })
  hasDisability: boolean;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'has_report', type: 'varchar', nullable: true })
  hasReport: string | null;
}