import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Admin } from '../domain/admin.entity';
import { IAdminRepository } from '../ports/admin.repository.interface';
import { ICurriculumRepository } from '../ports/curriculum.repository.interface';
import { IHashService } from '../ports/hash.service.interface';
import { IUserRepository } from '../ports/user.repository.interface';
import { CreateAdminCommand } from '../command/admin.command';
import { UserAlreadyExistsException } from '../exceptions/user-already-exists.exception';
import { StudentResumeResponseDto } from '../../adapters/in/dtos/admin/student-resume-response.dto';

export class AdminService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly adminRepository: IAdminRepository,
    private readonly hashService: IHashService,
    private readonly curriculumRepository: ICurriculumRepository,
  ) {}

  async createAdmin(command: CreateAdminCommand): Promise<Admin> {
    const existingUser = await this.userRepository.findByEmail(command.email);
    if (existingUser) {
      throw new UserAlreadyExistsException(command.email);
    }
    const hashedPassword = await this.hashService.hash(command.password);
    const adminUser = new Admin(randomUUID(), command.email, hashedPassword);
    return this.adminRepository.create(adminUser);
  }

  async getStudentResume(studentId: string): Promise<StudentResumeResponseDto> {
    const curriculum =
      await this.curriculumRepository.findActiveResumeByStudentId(studentId);

    if (!curriculum) {
      throw new NotFoundException(
        'Aluno não encontrado ou sem currículo cadastrado',
      );
    }

    return {
      id: curriculum.id,
      about: curriculum.about,
      linkedinUrl: curriculum.linkedin,
      githubUrl: curriculum.github,
      photoUrl: curriculum.profilePhoto,
      skills: curriculum.skills.map((s) => ({
        id: s.id,
        skillName: s.name,
      })),
      student: {
        fullName: curriculum.student.fullName,
        email: curriculum.student.email,
      },
    };
  }
}