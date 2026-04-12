/* eslint-disable @typescript-eslint/unbound-method */
import { AuthService } from '../../src/core/services/auth.service';
import { IUserRepository } from '../../src/core/ports/user.repository.interface';
import { IHashService } from '../../src/core/ports/hash.service.interface';
import { ITokenService } from '../../src/core/ports/token.service.interface';
import { InvalidCredentialsException } from '../../src/core/exceptions/invalid-credentials.exception';
import { LoginCommand } from '../../src/core/command/auth.command';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository: IUserRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockHashService: IHashService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const mockTokenService: ITokenService = {
    generate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      mockUserRepository,
      mockHashService,
      mockTokenService,
    );
  });

  describe('login', () => {
    const command: LoginCommand = {
      email: 'test@test.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@test.com',
      password: 'hashedPassword',
    };

    it('should return an access token if credentials are valid', async () => {
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockHashService.compare as jest.Mock).mockResolvedValue(true);
      (mockTokenService.generate as jest.Mock).mockReturnValue('access-token');

      const result = await service.login(command);

      expect(result.accessToken).toBe('access-token');
      expect(mockTokenService.generate).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });

    it('should throw InvalidCredentialsException if user not found', async () => {
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.login(command)).rejects.toThrow(
        InvalidCredentialsException,
      );
      expect(mockHashService.compare).not.toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsException if password does not match', async () => {
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockHashService.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(command)).rejects.toThrow(
        InvalidCredentialsException,
      );
      expect(mockTokenService.generate).not.toHaveBeenCalled();
    });
  });
});
