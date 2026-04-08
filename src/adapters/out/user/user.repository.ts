import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../../core/ports/user.repository.interface';
import { User } from '../../../core/domain/user.entity';
import { UserRole } from '../../../core/domain/user-role.enum';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepository: Repository<UserOrmEntity>,
  ) {}

  async create(user: User): Promise<User> {
    const ormEntity = this.ormRepository.create(user);
    const savedEntity = await this.ormRepository.save(ormEntity);
    return this.mapToDomain(savedEntity);
  }

  async findById(id: string): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { email } });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  private mapToDomain(orm: UserOrmEntity): User {
    return new User(
      orm.id,
      orm.name,
      orm.email,
      orm.passwordHash,
      orm.role as UserRole,
      orm.createdAt,
      orm.updatedAt,
    );
  }
}
