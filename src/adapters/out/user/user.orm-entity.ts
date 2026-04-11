import {
  Entity,
  Column,
  PrimaryColumn,
} from 'typeorm';

export type Role = 'admin' | 'student' | 'enterprise';

@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'varchar', nullable: true })
  role: Role;
}