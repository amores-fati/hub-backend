import { UserService } from '../../src/core/services/user.service';
import { IUserRepository } from '../../src/core/ports/user.repository.interface';
import { User } from '../../src/core/domain/user.entity';
import { UserAlreadyExistsException } from '../../src/core/exceptions/user-already-exists.exception';

describe('UserService', () => {
  let service: UserService;

  const mockRepository: IUserRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService(mockRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user if email is unique', async () => {
    (mockRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    (mockRepository.create as jest.Mock).mockImplementation((user) =>
      Promise.resolve(user),
    );

    const result = await service.createUser('john@test.com', 'password123');
    expect(result.id).toBeDefined();
    expect(result.email).toBe('john@test.com');
  });

  it('should throw UserAlreadyExistsException if email already exists', async () => {
    (mockRepository.findByEmail as jest.Mock).mockResolvedValue(
      new User('id', 'john@test.com', 'hashedPassword'),
    );

    await expect(
      service.createUser('john@test.com', 'password123'),
    ).rejects.toThrow(UserAlreadyExistsException);
  });
});
