import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';
import { DisabilityOrmEntity } from './disability.orm-entity';

@Entity('student_disability')
export class StudentDisabilityOrmEntity {
  @PrimaryColumn('uuid')
  studentId: string;

  @PrimaryColumn('uuid')
  disabilityId: string;

  @ManyToOne(() => StudentOrmEntity, (student) => student.disabilities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'fk_student_disability__student_id__students',
  })
  student: StudentOrmEntity;

  @ManyToOne(() => DisabilityOrmEntity, (disability) => disability.students, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'disability_id',
    foreignKeyConstraintName:
      'fk_student_disability__disability_id__disabilities',
  })
  disability: DisabilityOrmEntity;
}
