import { randomUUID } from 'crypto';
import { Student } from '../domain/student.entity';
import { Contact } from '../domain/contact.entity';
import { Disability } from '../domain/disability.entity';
import { SocialBenefit } from '../domain/social-benefit.entity';
import { IStudentRepository } from '../ports/student.repository.interface';
import { StudentAlreadyExistsException } from '../exceptions/student-already-exists.exception';
import {
  CreateStudentCommand,
  PatchStudentCommand,
  UpdateStudentCommand,
} from '../command/student.command';
import { StudentNotFoundException } from '../exceptions/student-not-found.exception';
import { IHashService } from '../ports/hash.service.interface';
import { IUserRepository } from '../ports/user.repository.interface';
import { UserAlreadyExistsException } from '../exceptions/user-already-exists.exception';

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

  async deleteStudent(id: string): Promise<void> {
    const student = await this.getStudentById(id);
    await this.studentRepository.delete(student.id);
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
}
