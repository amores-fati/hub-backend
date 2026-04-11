import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../core/domain/user.entity';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class UserRepository implements UserRepository {
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

  private mapToDomain(ormEntity: UserOrmEntity): User {
    return new User(
      ormEntity.id,
      ormEntity.name,
      ormEntity.email,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }
}
