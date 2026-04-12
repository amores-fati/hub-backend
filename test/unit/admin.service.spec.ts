/* eslint-disable @typescript-eslint/unbound-method */
import { AdminService } from '../../src/core/services/admin.service';
import { IUserRepository } from '../../src/core/ports/user.repository.interface';
import { IAdminRepository } from '../../src/core/ports/admin.repository.interface';
import { IHashService } from '../../src/core/ports/hash.service.interface';
import { CreateAdminCommand } from '../../src/core/command/admin.command';
import { Admin } from '../../src/core/domain/admin.entity';
import { UserAlreadyExistsException } from '../../src/core/exceptions/user-already-exists.exception';

describe('AdminService', () => {
  let service: AdminService;

  const mockUserRepository: IUserRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockAdminRepository: IAdminRepository = {
    create: jest.fn(),
  };

  const mockHashService: IHashService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminService(
      mockUserRepository,
      mockAdminRepository,
      mockHashService,
    );
  });

  describe('createAdmin', () => {
    const command: CreateAdminCommand = {
      email: 'admin@test.com',
      password: 'password123',
    };

    it('should create an admin if email is unique', async () => {
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockHashService.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (mockAdminRepository.create as jest.Mock).mockImplementation((admin) =>
        Promise.resolve(admin),
      );

      const result = await service.createAdmin(command);

      expect(result).toBeInstanceOf(Admin);
      expect(result.email).toBe(command.email);
      expect(result.password).toBe('hashedPassword');
      expect(mockAdminRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw UserAlreadyExistsException if email already exists', async () => {
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: 'some-id',
        email: command.email,
      });

      await expect(service.createAdmin(command)).rejects.toThrow(
        UserAlreadyExistsException,
      );
      expect(mockAdminRepository.create).not.toHaveBeenCalled();
    });
  });
});
