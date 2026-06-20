import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../../core/ports/user.repository.interface';
import { User } from '../../../core/domain/user.entity';
import { UserOrmEntity } from '../orm/user.orm-entity';

class BaseUser extends User {
  constructor(id: string, email: string, password: string) {
    super(id, email, password);
  }
}

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepository: Repository<UserOrmEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id },
    });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async findByEmail(
    email: string,
    includeDeleted?: boolean,
  ): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { email },
      withDeleted: includeDeleted,
    });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.ormRepository.update(id, { password: passwordHash });
  }

  private mapToDomain(ormEntity: UserOrmEntity): User {
    return new BaseUser(ormEntity.id, ormEntity.email, ormEntity.password);
  }
}
