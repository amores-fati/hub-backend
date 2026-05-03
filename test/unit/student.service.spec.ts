/* eslint-disable @typescript-eslint/unbound-method */
import { Contact } from '../../src/core/domain/contact.entity';
import {
  EducationLevel,
  Gender,
  Race,
} from '../../src/core/domain/enums/student-profile.enum';
import { Student } from '../../src/core/domain/student.entity';
import {
  CreateStudentCommand,
  PatchStudentCommand,
  UpdateStudentCommand,
  UpdateStudentMeCommand,
} from '../../src/core/command/student.command';
import { StudentAlreadyExistsException } from '../../src/core/exceptions/student-already-exists.exception';
import { StudentNotFoundException } from '../../src/core/exceptions/student-not-found.exception';
import { IHashService } from '../../src/core/ports/hash.service.interface';
import { IStudentRepository } from '../../src/core/ports/student.repository.interface';
import { IUserRepository } from '../../src/core/ports/user.repository.interface';
import { StudentService } from '../../src/core/services/student.service';
import { UserAlreadyExistsException } from '../../src/core/exceptions/user-already-exists.exception';

describe('StudentService', () => {
  let service: StudentService;

  const mockRepository: IStudentRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCpf: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDeleteMany: jest.fn(),
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

  let mockContact: Contact;
  let mockStudent: Student;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContact = new Contact(
      'contact-id',
      '11999999999',
      'Bela Vista',
      'SP',
      'Sao Paulo',
      'Avenida Paulista',
      '01310100',
      'Bloco A',
    );

    mockStudent = new Student(
      '123e4567-e89b-12d3-a456-426614174000',
      'hashedPassword',
      'aluno@teste.com',
      '12345678909',
      mockContact,
      new Date('1990-01-01'),
      Gender.MALE,
      Race.WHITE,
      'João da Silva',
    );

    service = new StudentService(
      mockRepository,
      mockUserRepository,
      mockHashService,
    );
  });

  describe('createStudent', () => {
    it('should create a student if CPF is unique', async () => {
      const command: CreateStudentCommand = {
        email: mockStudent.email,
        password: 'password123',
        cpf: mockStudent.cpf,
        birthDate: new Date('1990-01-01'),
        gender: Gender.MALE,
        race: Race.WHITE,
        fullName: 'João da Silva',
        education: EducationLevel.SECONDARY,
        contact: {
          phone: mockContact.phone,
          neighbourhood: mockContact.neighbourhood,
          state: mockContact.state,
          city: mockContact.city,
          address: mockContact.address,
          cep: mockContact.cep,
          complement: mockContact.complement,
        },
      };

      (mockRepository.findByCpf as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockHashService.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (mockRepository.create as jest.Mock).mockImplementation((student) =>
        Promise.resolve(student),
      );

      const result = await service.createStudent(command);

      expect(result.id).toBeDefined();
      expect(result.cpf).toBe(mockStudent.cpf);
      expect(result.password).toBe('hashedPassword');
      expect(result.contact.id).toBe(result.id);
      expect(result.gender).toBe(Gender.MALE);
      expect(result.race).toBe(Race.WHITE);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw StudentAlreadyExistsException if CPF already exists', async () => {
      const command: CreateStudentCommand = {
        email: mockStudent.email,
        password: 'password123',
        cpf: mockStudent.cpf,
        birthDate: new Date('1990-01-01'),
        gender: Gender.MALE,
        race: Race.WHITE,
        fullName: 'João da Silva',
        contact: { phone: '11999999999' },
      };

      (mockRepository.findByCpf as jest.Mock).mockResolvedValue(mockStudent);

      await expect(service.createStudent(command)).rejects.toThrow(
        StudentAlreadyExistsException,
      );
    });

    it('should throw UserAlreadyExistsException if email already exists', async () => {
      const command: CreateStudentCommand = {
        email: mockStudent.email,
        password: 'password123',
        cpf: mockStudent.cpf,
        birthDate: new Date('1990-01-01'),
        gender: Gender.MALE,
        race: Race.WHITE,
        fullName: 'João da Silva',
        contact: { phone: '11999999999' },
      };

      (mockRepository.findByCpf as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(
        mockStudent,
      );

      await expect(service.createStudent(command)).rejects.toThrow(
        UserAlreadyExistsException,
      );
    });
  });

  describe('findAllStudents', () => {
    it('should return an array of students', async () => {
      (mockRepository.findAll as jest.Mock).mockResolvedValue([mockStudent]);

      const result = await service.findAllStudents();

      expect(result).toHaveLength(1);
      expect(result[0].cpf).toBe(mockStudent.cpf);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStudentById', () => {
    it('should return a student by ID', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockStudent);

      const result = await service.getStudentById(mockStudent.id);

      expect(result).toBe(mockStudent);
      expect(mockRepository.findById).toHaveBeenCalledWith(mockStudent.id);
    });

    it('should throw StudentNotFoundException if ID is not found', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.getStudentById('invalid-id')).rejects.toThrow(
        StudentNotFoundException,
      );
    });
  });

  describe('getStudentByCpf', () => {
    it('should return a student by CPF', async () => {
      (mockRepository.findByCpf as jest.Mock).mockResolvedValue(mockStudent);

      const result = await service.getStudentByCpf(mockStudent.cpf);

      expect(result).toBe(mockStudent);
      expect(mockRepository.findByCpf).toHaveBeenCalledWith(mockStudent.cpf);
    });

    it('should throw StudentNotFoundException if CPF is not found', async () => {
      (mockRepository.findByCpf as jest.Mock).mockResolvedValue(null);

      await expect(service.getStudentByCpf('invalid-cpf')).rejects.toThrow(
        StudentNotFoundException,
      );
    });
  });

  describe('updateStudent', () => {
    const updateCommand: UpdateStudentCommand = {
      email: 'novoaluno@teste.com',
      fullName: 'João da Silva',
      password: 'newpassword123',
      birthDate: new Date('1995-05-05'),
      gender: Gender.FEMALE,
      race: Race.BROWN,
      education: EducationLevel.HIGHER,
      contact: {
        phone: '21999999999',
        neighbourhood: 'Copacabana',
        state: 'RJ',
        city: 'Rio de Janeiro',
        address: 'Avenida Atlantica',
        cep: '22070000',
        complement: '100',
      },
    };

    it('should update and return the student', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockStudent);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockHashService.hash as jest.Mock).mockResolvedValue(
        'hashedPassword-new',
      );
      (mockRepository.update as jest.Mock).mockImplementation((student) =>
        Promise.resolve(student),
      );

      const result = await service.updateStudent(mockStudent.id, updateCommand);

      expect(result.email).toBe(updateCommand.email);
      expect(result.contact.city).toBe(updateCommand.contact.city);
      expect(result.gender).toBe(Gender.FEMALE);
      expect(result.race).toBe(Race.BROWN);
      expect(result.birthDate?.toISOString()).toContain('1995-05-05');
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw UserAlreadyExistsException when updating to a duplicated email', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockStudent);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(
        new Student(
          '223e4567-e89b-12d3-a456-426614174111',
          'hashedPassword',
          'duplicado@teste.com',
          '98765432100',
          mockContact,
          new Date('1991-01-01'),
          Gender.FEMALE,
          Race.BLACK,
          'Duplicado da Silva',
        ),
      );

      await expect(
        service.updateStudent(mockStudent.id, {
          ...updateCommand,
          email: 'duplicado@teste.com',
        }),
      ).rejects.toThrow(UserAlreadyExistsException);
    });
  });

  describe('patchStudent', () => {
    it('should partially update and return the student', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(
        new Student(
          mockStudent.id,
          mockStudent.password,
          mockStudent.email,
          mockStudent.cpf,
          mockContact,
          mockStudent.birthDate,
          mockStudent.gender,
          mockStudent.race,
          mockStudent.fullName,
        ),
      );
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockRepository.update as jest.Mock).mockImplementation((student) =>
        Promise.resolve(student),
      );

      const partialData: PatchStudentCommand = {
        gender: Gender.NON_BINARY,
        birthDate: new Date('1990-01-01'),
      };
      const result = await service.patchStudent(mockStudent.id, partialData);

      expect(result.gender).toBe(Gender.NON_BINARY);
      expect(result.email).toBe(mockStudent.email);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should partially update password and return the student', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockStudent);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockHashService.hash as jest.Mock).mockResolvedValue(
        'hashedPassword-new',
      );
      (mockRepository.update as jest.Mock).mockImplementation((student) =>
        Promise.resolve(student),
      );

      const partialData: PatchStudentCommand = { password: 'newpassword123' };
      const result = await service.patchStudent(mockStudent.id, partialData);

      expect(result.password).toBe('hashedPassword-new');
      expect(mockHashService.hash).toHaveBeenCalledWith('newpassword123');
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw UserAlreadyExistsException when patching to a duplicated email', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockStudent);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(
        new Student(
          '223e4567-e89b-12d3-a456-426614174111',
          'hashedPassword',
          'duplicado@teste.com',
          '98765432100',
          mockContact,
          new Date('1991-01-01'),
          Gender.FEMALE,
          Race.BLACK,
          'Duplicado da Silva',
        ),
      );

      await expect(
        service.patchStudent(mockStudent.id, {
          email: 'duplicado@teste.com',
        }),
      ).rejects.toThrow(UserAlreadyExistsException);
    });
  });

  describe('updateAuthenticatedStudentProfile', () => {
    it('should update student profile successfully', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockStudent);
      (mockRepository.update as jest.Mock).mockImplementation((student) =>
        Promise.resolve(student),
      );

      const updateMeCommand: UpdateStudentMeCommand = {
        phone: '11988887777',
        city: 'Rio de Janeiro',
        state: 'RJ',
        address: 'Av Atlântica',
        cep: '22070000',
        gender: 'Masculino',
        race: 'Pardo',
        fatilabMotivation: 'Nova motivação',
      };

      const result = await service.updateAuthenticatedStudentProfile(
        mockStudent.id,
        updateMeCommand,
      );

      expect(result.contact.phone).toBe('11988887777');
      expect(result.contact.city).toBe('Rio de Janeiro');
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should ignore cpf and email updates', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockStudent);
      (mockRepository.update as jest.Mock).mockImplementation((student) =>
        Promise.resolve(student),
      );

      const originalEmail = mockStudent.email;
      const originalCpf = mockStudent.cpf;

      const invalidCommand = {
        email: 'hacker@teste.com',
        cpf: '00000000000',
        phone: '11988887777',
      };

      const result = await service.updateAuthenticatedStudentProfile(
        mockStudent.id,
        invalidCommand as unknown as UpdateStudentMeCommand,
      );

      expect(result.email).toBe(originalEmail);
      expect(result.cpf).toBe(originalCpf);
    });

    it('should throw error if student not found', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateAuthenticatedStudentProfile(
          'invalid-id',
          {} as UpdateStudentMeCommand,
        ),
      ).rejects.toThrow();
    });
  });

  describe('deleteStudents', () => {
    it('should soft delete existing students and return empty failed list', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockStudent);
      (mockRepository.softDeleteMany as jest.Mock).mockResolvedValue(undefined);

      const result = await service.deleteStudents([mockStudent.id]);

      expect(mockRepository.softDeleteMany).toHaveBeenCalledWith([
        mockStudent.id,
      ]);
      expect(result.failed).toHaveLength(0);
    });

    it('should return failed list for non-existing students', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);

      const result = await service.deleteStudents(['id-inexistente']);

      expect(mockRepository.softDeleteMany).not.toHaveBeenCalled();
      expect(result.failed).toContain('id-inexistente');
    });
  });
});
