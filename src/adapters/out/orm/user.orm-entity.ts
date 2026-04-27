import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { AdminOrmEntity } from './admin.orm-entity';
import { CompanyOrmEntity } from './company.orm-entity';
import { StudentOrmEntity } from './student.orm-entity';
import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';

const USER_ROLE_SQL = Object.values(UserRoleEnum)
  .map((value) => `'${value.replace(/'/g, "''")}'`)
  .join(', ');

@Check('ck_users__role', `"role" IN (${USER_ROLE_SQL})`)
@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 20 })
  role: UserRoleEnum;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  createdAt: Date;

  @OneToOne(() => StudentOrmEntity, (s) => s.user)
  student: StudentOrmEntity | null;

  @OneToOne(() => CompanyOrmEntity, (c) => c.user)
  company: CompanyOrmEntity | null;

  @OneToOne(() => AdminOrmEntity, (a) => a.user)
  admin: AdminOrmEntity | null;
}
