/* eslint-disable @typescript-eslint/unbound-method */
import { Contact } from '../../src/core/domain/contact.entity';
import { Gender, Race } from '../../src/core/domain/enums/student-profile.enum';
import { Student } from '../../src/core/domain/student.entity';
import { StudentNotFoundException } from '../../src/core/exceptions/student-not-found.exception';
import { IHashService } from '../../src/core/ports/hash.service.interface';
import { IStudentRepository } from '../../src/core/ports/student.repository.interface';
import { IUserRepository } from '../../src/core/ports/user.repository.interface';
import { StudentService } from '../../src/core/services/student.service';

describe('StudentService - getMyProfile (getStudentById)', () => {
  let service: StudentService;

  const mockRepository: IStudentRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCpf: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    existsById: jest.fn(),
  };

  const mockUserRepository: IUserRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockHashService: IHashService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  let mockStudent: Student;

  beforeEach(() => {
    jest.clearAllMocks();

    const contact = new Contact(
      'c07d8512-a4e6-4c83-a02e-acb8db833df4',
      '51999999999',
      'Bela Vista',
      'RS',
      'Porto Alegre',
      'Rua Example',
      '90000000',
    );

    mockStudent = new Student(
      'c07d8512-a4e6-4c83-a02e-acb8db833df4',
      'hashedPassword',
      'aluno01@fatilab.com',
      '10000000000',
      contact,
      new Date('1998-03-15'),
      Gender.FEMALE,
      Race.BROWN,
      'Aluno Full Name',
    );

    service = new StudentService(
      mockRepository,
      mockUserRepository,
      mockHashService,
    );
  });

  it('deve retornar o perfil do aluno quando encontrado', async () => {
    (mockRepository.findById as jest.Mock).mockResolvedValue(mockStudent);

    const result = await service.getStudentById(mockStudent.id);

    expect(result).toBe(mockStudent);
  });

  it('deve chamar o repositório com o userId correto do token', async () => {
    (mockRepository.findById as jest.Mock).mockResolvedValue(mockStudent);

    await service.getStudentById(mockStudent.id);

    expect(mockRepository.findById).toHaveBeenCalledWith(mockStudent.id);
    expect(mockRepository.findById).toHaveBeenCalledTimes(1);
  });

  it('deve lançar StudentNotFoundException quando aluno não existe', async () => {
    (mockRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(service.getStudentById('id-inexistente')).rejects.toThrow(
      StudentNotFoundException,
    );
  });

  it('deve retornar o perfil completo incluindo email do usuário', async () => {
    (mockRepository.findById as jest.Mock).mockResolvedValue(mockStudent);

    const result = await service.getStudentById(mockStudent.id);

    expect(result.email).toBe(mockStudent.email);
    expect(result.cpf).toBe(mockStudent.cpf);
    expect(result.contact).toBeDefined();
  });
});
