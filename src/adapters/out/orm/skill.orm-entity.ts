import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('skills')
export class SkillOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;
}