import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISkillRepository } from '../../../core/ports/skill.repository.interface';
import { Skill } from '../../../core/domain/skill.entity';
import { SkillOrmEntity } from '../orm/skill.orm-entity';

@Injectable()
export class SkillRepository implements ISkillRepository {
  constructor(
    @InjectRepository(SkillOrmEntity)
    private readonly ormRepository: Repository<SkillOrmEntity>,
  ) {}

  async findAll(): Promise<Skill[]> {
    const ormEntities = await this.ormRepository.find({
      order: { name: 'ASC' },
    });
    return ormEntities.map((entity) => this.mapToDomain(entity));
  }

  private mapToDomain(ormEntity: SkillOrmEntity): Skill {
    return new Skill(ormEntity.id, ormEntity.name);
  }
}
