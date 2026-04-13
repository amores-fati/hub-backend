import { Entity, PrimaryColumn, Column, OneToOne } from 'typeorm';
import { StudentOrmEntity } from './student.orm-entity';
import { CompanyOrmEntity } from './company.orm-entity';
import { AdminOrmEntity } from './admin.orm-entity';
import { UserRoleEnum } from '../../../core/domain/user-role.enum';

@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  password: string;

  @OneToOne(() => StudentOrmEntity, (s) => s.user)
  student: StudentOrmEntity | null;

  @OneToOne(() => CompanyOrmEntity, (c) => c.user)
  company: CompanyOrmEntity | null;

  @OneToOne(() => AdminOrmEntity, (a) => a.user)
  admin: AdminOrmEntity | null;

  // propriedade derivada, não é coluna
  get role(): UserRoleEnum {
    if (this.student) return UserRoleEnum.STUDENT;
    if (this.company) return UserRoleEnum.COMPANY;
    if (this.admin) return UserRoleEnum.ADMIN;
    throw new Error(`Usuário ${this.id} não possui role definida.`);
  }
}
