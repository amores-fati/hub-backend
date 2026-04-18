import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAdminRepository } from '../../../core/ports/admin.repository.interface';
import { UserOrmEntity } from '../orm/user.orm-entity';
import { AdminOrmEntity } from '../orm/admin.orm-entity';
import { Admin } from 'src/core/domain/admin.entity';
import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';

@Injectable()
export class AdminRepository implements IAdminRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
  private readonly userRepository: Repository<UserOrmEntity>,
  @InjectRepository(AdminOrmEntity)
  private readonly adminRepository: Repository<AdminOrmEntity>,
  ) {}

  async existsById(id: string): Promise<boolean> {
    return this.adminRepository.exists({ where: { id } });
  }

  async create(admin: Admin): Promise<Admin> {
    const userEntity = this.userRepository.create({
      id: admin.id,
      email: admin.email,
      password: admin.password,
      role: UserRoleEnum.ADMIN,
    });

    const adminEntity = this.adminRepository.create({
      id: admin.id,
      user: userEntity,
    });

    await this.userRepository.manager.transaction(async (entityManager) => {
      await entityManager.save(userEntity);
      await entityManager.save(adminEntity);
    });

    return this.mapToDomain(userEntity);
  }

  private mapToDomain(ormEntity: UserOrmEntity): Admin {
    return new Admin(ormEntity.id, ormEntity.email, ormEntity.password);
  }
}
