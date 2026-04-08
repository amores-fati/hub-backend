import { AuthService } from '../../src/core/services/auth.service';
import { IUserRepository } from '../../src/core/ports/user.repository.interface';
import { IHashService } from '../../src/core/ports/hash.service.interface';
import { ITokenService } from '../../src/core/ports/token.service.interface';
import { User } from '../../src/core/domain/user.entity';
import { InvalidCredentialsException } from '../../src/core/exceptions/invalid-credentials.exception';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository: IUserRepository = {
    create: jest.fn(),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw InvalidCredentialsException when email is not found', async () => {
    (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);

    await expect(service.login('notfound@test.com', 'anypass')).rejects.toThrow(
      InvalidCredentialsException,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(jest.mocked(mockHashService.compare)).not.toHaveBeenCalled();
  });

  it('should throw InvalidCredentialsException when password is wrong', async () => {
    const existingUser = new User(
      'uuid-1',
      'Luca',
      'luca@test.com',
      'hashed_password',
      'student',
      new Date(),
      new Date(),
    );
    (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(
      existingUser,
    );
    (mockHashService.compare as jest.Mock).mockResolvedValue(false);

    await expect(service.login('luca@test.com', 'wrongpass')).rejects.toThrow(
      InvalidCredentialsException,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(jest.mocked(mockTokenService.generate)).not.toHaveBeenCalled();
  });

  it('should return accessToken and role on valid credentials', async () => {
    const existingUser = new User(
      'uuid-1',
      'Luca',
      'luca@test.com',
      'hashed_password',
      'student',
      new Date(),
      new Date(),
    );
    (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(
      existingUser,
    );
    (mockHashService.compare as jest.Mock).mockResolvedValue(true);
    (mockTokenService.generate as jest.Mock).mockReturnValue('jwt.token.here');

    const result = await service.login('luca@test.com', 'correctpass');

    expect(result).toEqual({ accessToken: 'jwt.token.here', role: 'student' });

    expect(jest.mocked(mockTokenService.generate)).toHaveBeenCalledWith({
      sub: 'uuid-1',
      role: 'student',
    });
  });
});
