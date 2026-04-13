import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../../core/ports/user.repository.interface';
import { User } from '../../../core/domain/user.entity';
import { UserOrmEntity } from '../orm/user.orm-entity';
import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';

class BaseUser extends User {
  constructor(id: string, email: string, password: string, role: UserRoleEnum) {
    super(id, email, password, role);
  }
}

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepository: Repository<UserOrmEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { email },
      relations: ['student', 'company', 'admin'], // <-- isso deve estar faltando ou errado
    });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  private mapToDomain(ormEntity: UserOrmEntity): User {
    return new BaseUser(
      ormEntity.id,
      ormEntity.email,
      ormEntity.password,
      ormEntity.role,
    );
  }
}
