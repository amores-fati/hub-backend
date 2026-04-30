import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISettingRepository } from '../../../core/ports/setting.repository.interface';
import { Setting } from '../../../core/domain/setting.entity';
import { SettingOrmEntity } from '../orm/setting.orm-entity';

@Injectable()
export class SettingRepository implements ISettingRepository {
  constructor(
    @InjectRepository(SettingOrmEntity)
    private readonly ormRepository: Repository<SettingOrmEntity>,
  ) {}

  async findByKey(key: string): Promise<Setting | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { key } });
    if (!ormEntity) return null;
    return this.mapToDomain(ormEntity);
  }

  private mapToDomain(ormEntity: SettingOrmEntity): Setting {
    return new Setting(ormEntity.key, ormEntity.value);
  }
}
