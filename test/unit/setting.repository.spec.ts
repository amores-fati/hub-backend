import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingRepository } from '../../src/adapters/out/repository/setting.repository';
import { SettingOrmEntity } from '../../src/adapters/out/orm/setting.orm-entity';
import { Setting } from '../../src/core/domain/setting.entity';

describe('SettingRepository', () => {
  let repository: SettingRepository;
  let ormRepository: jest.Mocked<Repository<SettingOrmEntity>>;

  beforeEach(async () => {
    const ormRepositoryMock = {
      findOneBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingRepository,
        {
          provide: getRepositoryToken(SettingOrmEntity),
          useValue: ormRepositoryMock,
        },
      ],
    }).compile();

    repository = module.get<SettingRepository>(SettingRepository);
    ormRepository = module.get(getRepositoryToken(SettingOrmEntity));
  });

  describe('findByKey', () => {
    it('should return a setting if it exists in the database', async () => {
      const ormEntity = new SettingOrmEntity();
      ormEntity.id = '1';
      ormEntity.key = 'key';
      ormEntity.value = 'value';
      
      ormRepository.findOneBy.mockResolvedValue(ormEntity);

      const result = await repository.findByKey('key');

      expect(result).toBeInstanceOf(Setting);
      expect(result?.key).toBe('key');
      expect(ormRepository.findOneBy).toHaveBeenCalledWith({ key: 'key' });
    });

    it('should return null if the setting does not exist', async () => {
      ormRepository.findOneBy.mockResolvedValue(null);

      const result = await repository.findByKey('non_existent');

      expect(result).toBeNull();
    });
  });
});
