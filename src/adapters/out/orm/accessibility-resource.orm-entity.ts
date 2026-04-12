import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { AccessibilityResourceType } from 'src/core/domain/enums/accessibility-resource.enum';
import { StudentOrmEntity } from './student.orm-entity';

@Entity('accessibility_resource')
export class AccessibilityResourceOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  studentId: string;

  @Column({ type: 'varchar'})
  resource: AccessibilityResourceType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  resourceOther: string | null;

  @ManyToOne(
    () => StudentOrmEntity,
    (student) => student.accessibilityResources,
  )
  @JoinColumn({ name: 'student_id' })
  student!: StudentOrmEntity;
}