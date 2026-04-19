import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';

@Entity('disabilities')
export class DisabilityOrmEntity {
  @PrimaryColumn({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @OneToOne(() => StudentOrmEntity, (student) => student.disability, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'fk_disabilities__student_id__students',
  })
  student: StudentOrmEntity;

  @Column({ name: 'has_disability', type: 'boolean', default: false })
  hasDisability: boolean;

  @Column({ type: 'varchar', nullable: true })
  type: string | null;
}
