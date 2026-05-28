import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';

@Entity('address_student')
export class AddressStudentOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ type: 'varchar', nullable: true })
  neighbourhood: string | null;

  @Column({ type: 'char', length: 2, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 9, nullable: false })
  cep: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  complement: string | null;

  @OneToOne(() => StudentOrmEntity, (student) => student.address, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'student_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_address_student__student_id__students',
  })
  student: StudentOrmEntity;
}
