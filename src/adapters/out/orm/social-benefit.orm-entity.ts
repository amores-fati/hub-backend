import { Column, Entity, PrimaryColumn, ManyToMany } from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';

@Entity('social_benefit')
export class SocialBenefitOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToMany(() => StudentOrmEntity, (student) => student.socialBenefits)
  students: StudentOrmEntity[];
}
