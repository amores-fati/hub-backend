import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../../src/adapters/in/controllers/health.controller';
import { AmoresFatiLogger } from '../../src/utils/logger';

describe('HealthController', () => {
  let controller: HealthController;
  const logger = {
    info: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: AmoresFatiLogger, useValue: logger }],
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
