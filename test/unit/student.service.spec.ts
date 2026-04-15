/* eslint-disable @typescript-eslint/unbound-method */
import { StudentService } from '../../src/core/services/student.service';
import { IStudentRepository } from '../../src/core/ports/student.repository.interface';
import { Student } from '../../src/core/domain/student.entity';
import { StudentNotFoundException } from '../../src/core/exceptions/student-not-found.exception';
import { StudentAlreadyExistsException } from '../../src/core/exceptions/student-already-exists.exception';
import { Contact } from '../../src/core/domain/contact.entity';
import {
  CreateStudentCommand,
  UpdateStudentCommand,
  PatchStudentCommand,
} from '../../src/core/command/student.command';
import { IUserRepository } from '../../src/core/ports/user.repository.interface';
import { IHashService } from '../../src/core/ports/hash.service.interface';
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
      'São Paulo',
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
      'Aluno Teste',
      new Date('1990-01-01'),
      'Masculino',
      'Branca',
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
        socialName: mockStudent.socialName,
        birthDate: '1990-01-01',
        gender: mockStudent.gender!,
        race: mockStudent.race!,
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
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw StudentAlreadyExistsException if CPF already exists', async () => {
      const command: CreateStudentCommand = {
        email: mockStudent.email,
        password: 'password123',
        cpf: mockStudent.cpf,
        socialName: mockStudent.socialName,
        birthDate: '1990-01-01',
        gender: mockStudent.gender!,
        race: mockStudent.race!,
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
        socialName: mockStudent.socialName,
        birthDate: '1990-01-01',
        gender: mockStudent.gender!,
        race: mockStudent.race!,
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
      password: 'newpassword123',
      socialName: 'Aluno Atualizado',
      birthDate: '1995-05-05',
      gender: 'Feminino',
      race: 'Parda',
      contact: {
        phone: '21999999999',
        neighbourhood: 'Copacabana',
        state: 'RJ',
        city: 'Rio de Janeiro',
        address: 'Avenida Atlântica',
        cep: '22070000',
        complement: '100',
      },
    };

    it('should update and return the student', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockStudent);
      (mockHashService.hash as jest.Mock).mockResolvedValue(
        'hashedPassword-new',
      );
      (mockRepository.update as jest.Mock).mockImplementation((student) =>
        Promise.resolve(student),
      );

      const result = await service.updateStudent(mockStudent.id, updateCommand);

      expect(result.socialName).toBe(updateCommand.socialName);
      expect(result.contact.city).toBe(updateCommand.contact.city);
      expect(mockRepository.update).toHaveBeenCalled();
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
          mockStudent.socialName,
          mockStudent.birthDate,
          mockStudent.gender,
          mockStudent.race,
        ),
      );
      (mockRepository.update as jest.Mock).mockImplementation((student) =>
        Promise.resolve(student),
      );

      const partialData: PatchStudentCommand = { socialName: 'Nome Global' };
      const result = await service.patchStudent(mockStudent.id, partialData);

      expect(result.socialName).toBe(partialData.socialName);
      expect(result.email).toBe(mockStudent.email);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should partially update password and return the student', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockStudent);
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
  });

  describe('deleteStudent', () => {
    it('should delete a student', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(mockStudent);
      (mockRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await service.deleteStudent(mockStudent.id);

      expect(mockRepository.delete).toHaveBeenCalledWith(mockStudent.id);
    });
  });
});
