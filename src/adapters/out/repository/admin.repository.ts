import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAdminRepository } from '../../../core/ports/admin.repository.interface';
import { UserOrmEntity } from '../orm/user.orm-entity';
import { Admin } from 'src/core/domain/admin.entity';

@Injectable()
export class AdminRepository implements IAdminRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepository: Repository<UserOrmEntity>,
  ) {}

  async create(admin: Admin): Promise<Admin> {
    const ormEntity = this.ormRepository.create({
      id: admin.id,
      email: admin.email,
      password: admin.password,
    });
    const savedEntity = await this.ormRepository.save(ormEntity);
    return this.mapToDomain(savedEntity);
  }

  private mapToDomain(ormEntity: UserOrmEntity): Admin {
    return new Admin(ormEntity.id, ormEntity.email, ormEntity.password);
  }
}
