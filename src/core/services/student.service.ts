import { randomUUID } from 'crypto';
import { Student } from '../domain/student.entity';
import { Contact } from '../domain/contact.entity';
import { Disability } from '../domain/disability.entity';
import { SocialBenefit } from '../domain/social-benefit.entity';
import {
  IStudentRepository,
  StudentFilterQuery,
  StudentListProjection,
} from '../ports/student.repository.interface';
import { StudentAlreadyExistsException } from '../exceptions/student-already-exists.exception';
import {
  CreateStudentCommand,
  PatchStudentCommand,
  UpdateStudentCommand,
  UpdateStudentMeCommand,
} from '../command/student.command';
import { StudentNotFoundException } from '../exceptions/student-not-found.exception';
import { IHashService } from '../ports/hash.service.interface';
import { IUserRepository } from '../ports/user.repository.interface';
import { UserAlreadyExistsException } from '../exceptions/user-already-exists.exception';
import {
  EducationLevel,
  FamilyIncome,
  Gender,
  HowHeardChannel,
  Race,
} from '../domain/enums/student-profile.enum';
import { SocialBenefitType } from '../domain/enums/social-benefit.enum';
import { FilterStudentCommand } from '../command/filterStudent.command';

export interface StudentListItem {
  id: string;
  email: string;
  cpf: string;
  fullName: string;
  socialName?: string;
  city?: string;
  state?: string;
  hasDisability?: boolean;
  disabilityType?: string;
  enrollmentStatus: 'ONLINE' | 'PRESENCIAL' | 'NAO_INSCRITO';
}

export interface PaginatedStudentsResponse {
  items: StudentListItem[];
  meta: {
    page: number;
    pageSize: 20 | 50;
    total: number;
    totalPages: number;
  };
}

export class StudentService {
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly userRepository: IUserRepository,
    private readonly hashService: IHashService,
  ) {}

  async createStudent(command: CreateStudentCommand): Promise<Student> {
    const existingStudent = await this.studentRepository.findByCpf(command.cpf);

    if (existingStudent) {
      throw new StudentAlreadyExistsException(command.cpf);
    }

    await this.assertEmailAvailable(command.email);

    const studentId = randomUUID();
    const hashedPassword = await this.hashService.hash(command.password);

    const contact = new Contact(
      studentId,
      command.contact.phone,
      command.contact.neighbourhood,
      command.contact.state,
      command.contact.city,
      command.contact.address,
      command.contact.cep,
      command.contact.complement,
    );

    const disability = command.disability
      ? new Disability(
          studentId,
          command.disability.hasDisability,
          command.disability.type,
        )
      : undefined;

    const socialBenefits =
      command.socialBenefits?.map(
        (benefit, index) =>
          new SocialBenefit(-(index + 1), studentId, benefit.benefit),
      ) || [];

    const birthDate =
      command.birthDate instanceof Date
        ? command.birthDate
        : new Date(command.birthDate);

    const student = new Student(
      studentId,
      hashedPassword,
      command.email,
      command.cpf,
      contact,
      birthDate,
      command.gender,
      command.race,
      command.fullName,
      command.education,
      command.institution,
      command.activityArea,
      command.hasProgrammingExperience,
      command.motivation,
      command.howHeard,
      command.hasComputer,
      command.hasInternet,
      command.committedToParticipate,
      disability,
      socialBenefits,
      command.socialName,
      command.courseName,
      command.familyIncome,
    );

    return this.studentRepository.create(student);
  }

  async findAllStudents(): Promise<Student[]> {
    return this.studentRepository.findAll();
  }

  async findAllStudentsWithFilter(
    command: FilterStudentCommand,
  ): Promise<PaginatedStudentsResponse> {
    const query: StudentFilterQuery = {
      search: this.normalizeFilterValue(command.search),
      city: this.normalizeFilterValue(command.city),
      disabilityType: this.normalizeFilterValue(command.disabilityType),
      modality: this.normalizeFilterValue(command.modality),
      page: command.page ?? 1,
      pageSize: command.pageSize ?? 20,
    };

    const result = await this.studentRepository.findAllWithFilter(query);

    return {
      items: result.items.map((student) =>
        this.mapStudentListItem(student, query.modality),
      ),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / query.pageSize),
      },
    };
  }

  async getStudentById(id: string): Promise<Student> {
    const student = await this.studentRepository.findById(id);

    if (!student) {
      throw new StudentNotFoundException(id);
    }

    return student;
  }

  async getStudentByCpf(cpf: string): Promise<Student> {
    const student = await this.studentRepository.findByCpf(cpf);

    if (!student) {
      throw new StudentNotFoundException(cpf);
    }

    return student;
  }

  async updateStudent(
    id: string,
    command: UpdateStudentCommand,
  ): Promise<Student> {
    const student = await this.getStudentById(id);

    await this.assertEmailAvailable(command.email, student.id);
    student.changeEmail(command.email);

    if (command.password) {
      const hashedPassword = await this.hashService.hash(command.password);
      student.changePassword(hashedPassword);
    }
    student.changeSocialName(command.socialName);

    student.changeProfileData({
      fullName: command.fullName,
      socialName: command.socialName,
      birthDate: command.birthDate ? new Date(command.birthDate) : undefined,
      gender: command.gender,
      race: command.race,
    });

    student.changeParticipationData({
      motivation: command.motivation,
      howHeard: command.howHeard,
      hasComputer: command.hasComputer,
      hasInternet: command.hasInternet,
      committedToParticipate: command.committedToParticipate,
      familyIncome: command.familyIncome,
    });

    student.contact.changePhone(command.contact.phone);
    student.contact.changeAddress({
      neighbourhood: command.contact.neighbourhood,
      state: command.contact.state,
      city: command.contact.city,
      address: command.contact.address,
      cep: command.contact.cep,
      complement: command.contact.complement,
    });

    if (command.disability) {
      const disability = new Disability(
        student.id,
        command.disability.hasDisability,
        command.disability.type,
      );
      student.changeDisability(disability);
    }

    if (command.socialBenefits) {
      const benefits = command.socialBenefits.map(
        (benefit, index) =>
          new SocialBenefit(-(index + 1), student.id, benefit.benefit),
      );
      student.replaceSocialBenefits(benefits);
    }

    return this.studentRepository.update(student);
  }

  async updateAuthenticatedStudentProfile(
    userId: string,
    command: UpdateStudentMeCommand,
  ): Promise<Student> {
    const student = await this.getStudentById(userId);

    student.contact.changeAddress({
      city: command.city,
      state: command.state,
      address: command.address,
      cep: command.cep,
    });

    if (command.phone !== undefined) {
      student.contact.changePhone(command.phone);
    }

    student.changeProfileData({
      birthDate: command.birthDate ? new Date(command.birthDate) : undefined,
      gender: this.mapGender(command.gender),
      race: this.mapRace(command.race),
      socialName: command.socialName,
      education: this.mapEducation(command.educationLevel),
      courseName: command.courseName,
      institution: command.institution,
      activityArea: command.workArea ?? undefined,
      hasProgrammingExperience: command.hasProgrammingExperience,
    });

    student.changeParticipationData({
      motivation: command.fatilabMotivation,
      howHeard: this.mapHowHeard(command.howHeard),
      hasComputer: command.hasComputer,
      hasInternet: command.hasInternet,
      familyIncome: this.mapFamilyIncome(command.familyIncome),
    });

    if (command.isPcd !== undefined || command.disabilityType !== undefined) {
      student.changeDisability(
        new Disability(
          student.id,
          command.isPcd ?? false,
          command.disabilityType,
        ),
      );
    }

    if (command.socialBenefits !== undefined) {
      student.replaceSocialBenefits([
        new SocialBenefit(
          -1,
          student.id,
          this.mapSocialBenefit(command.socialBenefits),
        ),
      ]);
    }

    return this.studentRepository.update(student);
  }

  async patchStudent(
    id: string,
    command: PatchStudentCommand,
  ): Promise<Student> {
    const student = await this.getStudentById(id);

    if (command.email !== undefined) {
      await this.assertEmailAvailable(command.email, student.id);
      student.changeEmail(command.email);
    }
    if (command.password !== undefined) {
      const hashedPassword = await this.hashService.hash(command.password);
      student.changePassword(hashedPassword);
    }
    if (command.socialName !== undefined) {
      student.changeSocialName(command.socialName);
    }
    student.changeProfileData({
      fullName: command.fullName,
      socialName: command.socialName,
      birthDate:
        command.birthDate !== undefined
          ? new Date(command.birthDate)
          : undefined,
      gender: command.gender,
      race: command.race,
    });

    student.changeParticipationData({
      motivation: command.motivation,
      howHeard: command.howHeard,
      hasComputer: command.hasComputer,
      hasInternet: command.hasInternet,
      committedToParticipate: command.committedToParticipate,
      familyIncome: command.familyIncome,
    });

    if (command.contact) {
      if (command.contact.phone !== undefined) {
        student.contact.changePhone(command.contact.phone);
      }

      student.contact.changeAddress({
        neighbourhood: command.contact.neighbourhood,
        state: command.contact.state,
        city: command.contact.city,
        address: command.contact.address,
        cep: command.contact.cep,
        complement: command.contact.complement,
      });
    }

    if (command.disability) {
      const disability = new Disability(
        student.id,
        command.disability.hasDisability ?? false,
        command.disability.type,
      );
      student.changeDisability(disability);
    }

    if (command.socialBenefits) {
      const benefits = command.socialBenefits.map(
        (benefit, index) =>
          new SocialBenefit(-(index + 1), student.id, benefit.benefit!),
      );
      student.replaceSocialBenefits(benefits);
    }

    return this.studentRepository.update(student);
  }

  async deleteStudents(ids: string[]): Promise<{ failed: string[] }> {
    const notFound: string[] = [];
    const toDelete: string[] = [];

    for (const id of ids) {
      const student = await this.studentRepository.findById(id);
      if (!student) notFound.push(id);
      else toDelete.push(id);
    }

    if (toDelete.length > 0) {
      await this.studentRepository.softDeleteMany(toDelete);
    }

    return { failed: notFound };
  }

  private async assertEmailAvailable(
    email: string,
    currentUserId?: string,
  ): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser && existingUser.id !== currentUserId) {
      throw new UserAlreadyExistsException(email);
    }
  }

  private mapGender(value?: string): Gender | undefined {
    if (value === undefined) return undefined;

    const map: Record<string, Gender> = {
      Masculino: Gender.MALE,
      Feminino: Gender.FEMALE,
      'Não-binário': Gender.NON_BINARY,
      'Prefiro não informar': Gender.PREFER_NOT_TO_SAY,
      Outro: Gender.OTHER,
    };
    return map[value];
  }

  private mapRace(value?: string): Race | undefined {
    if (value === undefined) return undefined;

    const map: Record<string, Race> = {
      Branco: Race.WHITE,
      Branca: Race.WHITE,
      Preto: Race.BLACK,
      Preta: Race.BLACK,
      Pardo: Race.BROWN,
      Parda: Race.BROWN,
      Indígena: Race.INDIGENOUS,
      'Prefiro não informar': Race.PREFER_NOT_TO_SAY,
    };
    return map[value];
  }

  private mapEducation(value?: string): EducationLevel | undefined {
    if (value === undefined) return undefined;

    const map: Record<string, EducationLevel> = {
      'Sem escolaridade': EducationLevel.NO_EDUCATION,
      'Ensino Fundamental': EducationLevel.PRIMARY,
      'Ensino Médio': EducationLevel.SECONDARY,
      'Ensino Médio Completo': EducationLevel.SECONDARY,
      'Ensino Superior': EducationLevel.HIGHER,
      'Pós-graduação': EducationLevel.POSTGRADUATE,
    };
    return map[value];
  }

  private mapFamilyIncome(value?: string): FamilyIncome | undefined {
    if (value === undefined) return undefined;

    const map: Record<string, FamilyIncome> = {
      'Até 1 salário mínimo': FamilyIncome.TO1_SALARY,
      'Entre 1 e 3 salários mínimos': FamilyIncome.BETWEEN_1_3,
      'Mais de 3 salários mínimos': FamilyIncome.MORE_THAN_3,
    };
    return map[value];
  }

  private mapHowHeard(value?: string): HowHeardChannel | undefined {
    if (value === undefined) return undefined;

    const map: Record<string, HowHeardChannel> = {
      Instagram: HowHeardChannel.INSTAGRAM,
      'Redes sociais': HowHeardChannel.INSTAGRAM,
      Indicação: HowHeardChannel.REFEREE,
      LinkedIn: HowHeardChannel.LINKEDIN,
      Outros: HowHeardChannel.OTHERS,
      Outro: HowHeardChannel.OTHERS,
    };
    return map[value];
  }

  private mapSocialBenefit(value: string): SocialBenefitType {
    const map: Record<string, SocialBenefitType> = {
      'Bolsa Família': SocialBenefitType.BOLSA_FAMILIA,
      BPC: SocialBenefitType.BPC,
      Nenhum: SocialBenefitType.NONE,
      Outros: SocialBenefitType.OTHERS,
      Outro: SocialBenefitType.OTHERS,
    };
    return map[value] ?? SocialBenefitType.OTHERS;
  }

  private normalizeFilterValue(value?: string): string | undefined {
    const normalizedValue = value?.trim();
    return normalizedValue ? normalizedValue : undefined;
  }

  private mapStudentListItem(
    student: StudentListProjection,
    modality?: string,
  ): StudentListItem {
    return {
      id: student.id,
      email: student.email,
      cpf: this.maskCpf(student.cpf),
      fullName: student.fullName,
      socialName: student.socialName,
      city: student.city,
      state: student.state,
      hasDisability: student.hasDisability,
      disabilityType: student.disabilityType,
      enrollmentStatus: this.deriveEnrollmentStatus(student, modality),
    };
  }

  private deriveEnrollmentStatus(
    student: StudentListProjection,
    modality?: string,
  ): StudentListItem['enrollmentStatus'] {
    const enrollment = modality
      ? student.enrollments.find((item) => item.courseModality === modality)
      : student.enrollments[0];

    if (!enrollment) {
      return 'NAO_INSCRITO';
    }

    return enrollment.courseModality === 'PRESENCIAL' ? 'PRESENCIAL' : 'ONLINE';
  }

  private maskCpf(cpf: string): string {
    const digits = cpf.replace(/\D/g, '');

    if (digits.length !== 11) {
      return cpf;
    }

    return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
  }
}
