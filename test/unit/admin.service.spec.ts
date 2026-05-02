/* eslint-disable @typescript-eslint/unbound-method */
import { AdminService } from '../../src/core/services/admin.service';
import { IUserRepository } from '../../src/core/ports/user.repository.interface';
import { IAdminRepository } from '../../src/core/ports/admin.repository.interface';
import { IHashService } from '../../src/core/ports/hash.service.interface';
import { ICurriculumRepository } from '../../src/core/ports/curriculum.repository.interface'; // Novo import
import { CreateAdminCommand } from '../../src/core/command/admin.command';
import { Admin } from '../../src/core/domain/admin.entity';
import { UserAlreadyExistsException } from '../../src/core/exceptions/user-already-exists.exception';
import { NotFoundException } from '@nestjs/common'; // Novo import para o teste de erro

describe('AdminService', () => {
  let service: AdminService;

  const mockUserRepository: IUserRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockAdminRepository: IAdminRepository = {
    create: jest.fn(),
    existsById: jest.fn(),
  };

  const mockHashService: IHashService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  // Novo mock necessário para o construtor
  const mockCurriculumRepository: ICurriculumRepository = {
    findActiveResumeByStudentId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminService(
      mockUserRepository,
      mockAdminRepository,
      mockHashService,
      mockCurriculumRepository, // Injetado aqui para não dar erro de argumento
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

  // Novos testes para a funcionalidade de currículo
  describe('getStudentResume', () => {
    const studentId = 'student-uuid';

    it('should return a student resume if curriculum exists', async () => {
      const mockCurriculum = {
        id: 'curr-1',
        about: 'Sobre mim',
        linkedin: 'linkedin.com/in/user',
        github: 'github.com/user',
        profilePhoto: 'photo.jpg',
        skills: [
          { id: 's1', name: 'Node.js' },
          { id: 's2', name: 'TypeScript' }
        ],
        student: {
          fullName: 'Tarciso Mota',
          email: 'tarciso@test.com'
        }
      };

      (mockCurriculumRepository.findActiveResumeByStudentId as jest.Mock).mockResolvedValue(mockCurriculum);

      const result = await service.getStudentResume(studentId);

      expect(result.id).toBe('curr-1');
      expect(result.student.fullName).toBe('Tarciso Mota');
      expect(mockCurriculumRepository.findActiveResumeByStudentId).toHaveBeenCalledWith(studentId);
    });

    it('should throw NotFoundException if curriculum does not exist', async () => {
      (mockCurriculumRepository.findActiveResumeByStudentId as jest.Mock).mockResolvedValue(null);

      await expect(service.getStudentResume(studentId)).rejects.toThrow(NotFoundException);
    });
  });
});