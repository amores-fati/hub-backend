import { Test, TestingModule } from '@nestjs/testing';
import { SettingController } from '../../src/adapters/in/controllers/setting.controller';
import { SettingService } from '../../src/core/services/setting.service';
import { AmoresFatiLogger } from '../../src/utils/logger';
import { SettingNotFoundException } from '../../src/core/exceptions/setting-not-found.exception';
import { NotFoundException } from '@nestjs/common';

describe('SettingController', () => {
  let controller: SettingController;
  let service: jest.Mocked<SettingService>;
  let logger: jest.Mocked<AmoresFatiLogger>;

  beforeEach(async () => {
    const serviceMock = {
      getSettingByKey: jest.fn(),
    };
    const loggerMock = {
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingController],
      providers: [
        {
          provide: SettingService,
          useValue: serviceMock,
        },
        {
          provide: AmoresFatiLogger,
          useValue: loggerMock,
        },
      ],
    }).compile();

    controller = module.get<SettingController>(SettingController);
    service = module.get(SettingService);
    logger = module.get(AmoresFatiLogger);
  });

  describe('getPublicSetting', () => {
    it('should return the setting value', async () => {
      const expectedResult = {
        key: 'whatsapp_phone',
        value: '(51) 99266-9381',
      };
      service.getSettingByKey.mockResolvedValue(expectedResult);

      const result = await controller.getPublicSetting('whatsapp_phone');

      expect(result).toEqual(expectedResult);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('whatsapp_phone'),
      );
    });

    it('should throw NotFoundException if service throws SettingNotFoundException', async () => {
      service.getSettingByKey.mockRejectedValue(
        new SettingNotFoundException('non_existent'),
      );

      await expect(controller.getPublicSetting('non_existent')).rejects.toThrow(
        NotFoundException,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('non_existent'),
      );
    });
  });
});
