import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Admin } from '../domain/admin.entity';
import { IAdminRepository } from '../ports/admin.repository.interface';
import { ICurriculumRepository } from '../ports/curriculum.repository.interface';
import { IHashService } from '../ports/hash.service.interface';
import { StudentCityCount, DisabilityCount , IStudentRepository, } from '../ports/student.repository.interface';
import { IUserRepository } from '../ports/user.repository.interface';
import { ICompanyRepository } from '../ports/company.repository.interface';
import { CreateAdminCommand } from '../command/admin.command';
import { UserAlreadyExistsException } from '../exceptions/user-already-exists.exception';
import { StudentResumeResponseDto } from '../../adapters/in/dtos/admin/student-resume-response.dto';
import { IJobOpeningRepository } from '../ports/job-open.company.repository.interface';
import {
  LocationResponseDto,
  LocationScope,
} from '../../adapters/in/dtos/admin/get-locations.dto';
import {
  PaginatedResumesResponseDto,
  ResumeListItemDto,
} from '../../adapters/in/dtos/admin/paginated-resumes-response.dto';
import {
  ResumeFilterQuery,
  PaginatedResumeListResult,
  ResumeListProjection,
} from '../ports/curriculum.repository.interface';

export class AdminService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly adminRepository: IAdminRepository,
    private readonly hashService: IHashService,
    private readonly curriculumRepository: ICurriculumRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly jobOpeningRepository: IJobOpeningRepository,
    private readonly companyRepository: ICompanyRepository,
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
    const [curriculum, student] = await Promise.all([
      this.curriculumRepository.findByStudentId(studentId),
      this.studentRepository.findById(studentId),
    ]);

    if (!curriculum || !student) {
      throw new NotFoundException(
        'Aluno não encontrado ou sem currículo cadastrado',
      );
    }

    return {
      id: curriculum.id,
      about: curriculum.about,
      linkedinUrl: curriculum.linkedinUrl || '',
      githubUrl: curriculum.githubUrl || '',
      videoPresentationUrl: curriculum.videoPresentationUrl || '',
      photoUrl: curriculum.photoUrl,
      skills: curriculum.skills.map((s) => ({
        id: s.id,
        skillName: s.skillName,
      })),
      student: {
        fullName: student.fullName,
        email: student.email,
      },
    };
  }

  async getLocations(scope: LocationScope): Promise<LocationResponseDto[]> {
    if (scope === LocationScope.STUDENT) {
      return this.studentRepository.findLocations();
    }
    return this.companyRepository.findLocations();
  }

  async getResumes(query: ResumeFilterQuery): Promise<PaginatedResumesResponseDto> {
    const normalizedPage = Math.max(1, query.page);
    const normalizedLimit = Math.max(1, Math.min(50, query.limit));

    const filterQuery: ResumeFilterQuery = {
      search: query.search,
      interestArea: query.interestArea,
      preference: query.preference,
      status: query.status,
      city: query.city,
      page: normalizedPage,
      limit: normalizedLimit,
    };

    const result: PaginatedResumeListResult =
      await this.curriculumRepository.findAllWithFilter(filterQuery);

    return {
      data: result.items.map((item) => this.mapToResumeListItem(item)),
      meta: {
        page: normalizedPage,
        limit: normalizedLimit,
        total: result.total,
        totalPages: Math.ceil(result.total / normalizedLimit),
      },
    };
  }

  async getDisabilityStats(): Promise<DisabilityCount[]> {
    return this.studentRepository.countByDisabilityType();
  }

    async getStudentCountByCity(): Promise<StudentCityCount[]> {
    return this.studentRepository.countByCity();
  }

  async getDashboardStats(): Promise<{
  totalStudents: number;
  totalPcdStudents: number;
  totalOpenedJobs: number;
}> {
  const [totalStudents, totalPcdStudents, totalOpenedJobs] = await Promise.all([
    this.studentRepository.countTotal(),
   this.studentRepository.countPCD(),
    this.jobOpeningRepository.countActive(),
  ]);
  return { totalStudents, totalPcdStudents, totalOpenedJobs };
}

  private mapToResumeListItem(
    item: ResumeListProjection,
  ): ResumeListItemDto {
    return {
      id: item.id,
      studentId: item.studentId,
      cpf: item.cpf,
      fullName: item.fullName,
      socialName: item.socialName,
      email: item.email,
      isAvailable: item.isAvailable,
      about: item.about,
      linkedin: item.linkedin,
      github: item.github,
      preference: item.preference,
      phone: item.phone,
    };
  }
}
