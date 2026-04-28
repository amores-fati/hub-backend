import { SettingService } from '../../src/core/services/setting.service';
import { ISettingRepository } from '../../src/core/ports/setting.repository.interface';
import { Setting } from '../../src/core/domain/setting.entity';
import { SettingNotFoundException } from '../../src/core/exceptions/setting-not-found.exception';

describe('SettingService', () => {
  let service: SettingService;
  let repository: jest.Mocked<ISettingRepository>;

  beforeEach(() => {
    repository = {
      findByKey: jest.fn(),
    } as any;
    service = new SettingService(repository);
  });

  describe('getSettingByKey', () => {
    it('should return a setting if it exists', async () => {
      const setting = new Setting('1', 'whatsapp_phone', '(51) 99266-9381');
      repository.findByKey.mockResolvedValue(setting);

      const result = await service.getSettingByKey('whatsapp_phone');

      expect(result).toEqual({
        key: 'whatsapp_phone',
        value: '(51) 99266-9381',
      });
      expect(repository.findByKey).toHaveBeenCalledWith('whatsapp_phone');
    });

    it('should throw SettingNotFoundException if setting does not exist', async () => {
      repository.findByKey.mockResolvedValue(null);

      await expect(service.getSettingByKey('non_existent')).rejects.toThrow(SettingNotFoundException);
      expect(repository.findByKey).toHaveBeenCalledWith('non_existent');
    });
  });
});
