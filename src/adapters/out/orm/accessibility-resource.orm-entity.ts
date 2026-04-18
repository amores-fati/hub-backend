import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccessibilityResourceType } from '../../../core/domain/enums/accessibility-resource.enum';
import { StudentOrmEntity } from './student.orm-entity';

const ACCESSIBILITY_RESOURCE_SQL = Object.values(AccessibilityResourceType)
  .map((value) => `'${value.replace(/'/g, "''")}'`)
  .join(', ');

@Check(
  'ck_accessibility_resources__resource',
  `"resource" IN (${ACCESSIBILITY_RESOURCE_SQL})`,
)
@Entity('accessibility_resources')
export class AccessibilityResourceOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('ix_accessibility_resources__student_id')
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ type: 'varchar' })
  resource: AccessibilityResourceType;

  @ManyToOne(
    () => StudentOrmEntity,
    (student) => student.accessibilityResources,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName:
      'fk_accessibility_resources__student_id__students',
  })
  student: StudentOrmEntity;
}
