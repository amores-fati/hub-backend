import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';

@Entity('disability')
export class DisabilityOrmEntity {
  @PrimaryColumn('varchar')
  studentId!: string;

  @Column({ type: 'boolean' })
  hasDisability!: boolean;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', nullable: true })
  hasReport!: string | null;

  @Column({ type: 'varchar', nullable: true })
  type!: string | null;

  @OneToOne(() => StudentOrmEntity, (student) => student.disability)
  @JoinColumn({ name: 'student_id', referencedColumnName: 'id' })
  student!: StudentOrmEntity;
}