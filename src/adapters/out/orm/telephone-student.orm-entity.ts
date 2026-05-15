import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';

@Entity('telephone_student')
export class TelephoneStudentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @OneToOne(() => StudentOrmEntity, (student) => student.telephone, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'student_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_telephone_student__student_id__students',
  })
  student: StudentOrmEntity;
}
