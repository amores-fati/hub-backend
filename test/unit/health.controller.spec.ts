import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../../src/adapters/in/controllers/health.controller';
import { AmoresFatiLogger } from '../../src/utils/logger';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const loggerMock = {
      setContext: jest.fn(),
      info: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: AmoresFatiLogger,
          useValue: loggerMock,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return ok and a timestamp', () => {
    const response = controller.check();
    expect(response.status).toBe('ok');
    expect(response.timestamp).toBeDefined();
  });
});
