import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { AccessibilityResourceType } from '../../../core/domain/enums/accessibility-resource.enum';
import { StudentOrmEntity } from './student.orm-entity';

@Entity('accessibility_resources')
export class AccessibilityResourceOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ type: 'varchar' })
  resource: AccessibilityResourceType;


  @ManyToOne(
    () => StudentOrmEntity,
    (student) => student.accessibilityResources,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'student_id' })
  student: StudentOrmEntity;
}
