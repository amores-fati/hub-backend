import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';

@Entity('accessibility_resources')
export class AccessibilityResourceOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_id' })
  student_id: string;

  @ManyToOne(() => StudentOrmEntity, (student) => student.accessibilityResources)
  @JoinColumn({ name: 'student_id' })
  student: StudentOrmEntity;

  @Column({ type: 'varchar' })
  resource: string;

  @Column({ length: 100, nullable: true })
  resource_other: string;
}