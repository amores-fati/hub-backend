import { randomUUID } from 'crypto';
import { Student } from '../domain/student.entity';
import { Contact } from '../domain/contact.entity';
import { Disability } from '../domain/disability.entity';
import { SocialBenefit } from '../domain/social-benefit.entity';
import { AccessibilityResource } from '../domain/accessibility-resource.entity';
import { IStudentRepository } from '../ports/student.repository.interface';
import { StudentAlreadyExistsException } from '../exceptions/student-already-exists.exception';
import {
  CreateStudentCommand,
  PatchStudentCommand,
  UpdateStudentCommand,
} from '../command/student.command';
import { StudentNotFoundException } from '../exceptions/student-not-found.exception';

export class StudentService {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async createStudent(command: CreateStudentCommand): Promise<Student> {
    const existingStudent = await this.studentRepository.findByCpf(command.cpf);

    if (existingStudent) {
      throw new StudentAlreadyExistsException(command.cpf);
    }

    const studentId = randomUUID();

    const contact = new Contact(
      randomUUID(),
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
          command.disability.description,
          command.disability.hasReport,
          command.disability.type,
        )
      : undefined;

    const socialBenefits =
      command.socialBenefits?.map(
        (benefit, index) =>
          new SocialBenefit(
            index + 1,
            studentId,
            benefit.benefit,
            benefit.benefitOther,
          ),
      ) || [];

    const accessibilityResources =
      command.accessibilityResources?.map(
        (resource, index) =>
          new AccessibilityResource(
            index + 1,
            studentId,
            resource.resource,
            resource.resourceOther,
          ),
      ) || [];

    const student = new Student(
      studentId,
      command.password,
      command.email,
      command.cpf,
      contact,
      command.socialName,
      command.birthDate ? new Date(command.birthDate) : undefined,
      command.gender,
      command.race,
      command.education,
      command.courseName,
      command.institution,
      command.activityArea,
      command.hasProgrammingExperience,
      command.hasTechCourses,
      command.techCoursesList,
      command.sendCurriculum ?? false,
      command.fatilabMotivation,
      command.howHeard,
      command.hasComputer,
      command.hasInternet,
      command.committedToParticipate,
      disability,
      socialBenefits,
      accessibilityResources,
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

    student.changeEmail(command.email);
    student.changePassword(command.password);
    student.changeSocialName(command.socialName);

    student.changeAcademicData({
      education: command.education,
      courseName: command.courseName,
      institution: command.institution,
      activityArea: command.activityArea,
    });

    student.changeTechnologyData({
      hasProgrammingExperience: command.hasProgrammingExperience,
      hasTechCourses: command.hasTechCourses,
      techCoursesList: command.techCoursesList,
    });

    student.changeParticipationData({
      sendCurriculum: command.sendCurriculum,
      fatilabMotivation: command.fatilabMotivation,
      howHeard: command.howHeard,
      hasComputer: command.hasComputer,
      hasInternet: command.hasInternet,
      committedToParticipate: command.committedToParticipate,
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
        command.disability.description,
        command.disability.hasReport,
        command.disability.type,
      );
      student.changeDisability(disability);
    }

    if (command.socialBenefits) {
      const benefits = command.socialBenefits.map(
        (benefit, index) =>
          new SocialBenefit(
            index + 1,
            student.id,
            benefit.benefit,
            benefit.benefitOther,
          ),
      );
      student.replaceSocialBenefits(benefits);
    }

    if (command.accessibilityResources) {
      const resources = command.accessibilityResources.map(
        (resource, index) =>
          new AccessibilityResource(
            index + 1,
            student.id,
            resource.resource,
            resource.resourceOther,
          ),
      );
      student.replaceAccessibilityResources(resources);
    }

    return this.studentRepository.update(student);
  }

  async patchStudent(
    id: string,
    command: PatchStudentCommand,
  ): Promise<Student> {
    const student = await this.getStudentById(id);

    if (command.email !== undefined) student.changeEmail(command.email);
    if (command.password !== undefined) student.changePassword(command.password);
    if (command.socialName !== undefined) {
      student.changeSocialName(command.socialName);
    }

    student.changeAcademicData({
      education: command.education,
      courseName: command.courseName,
      institution: command.institution,
      activityArea: command.activityArea,
    });

    student.changeTechnologyData({
      hasProgrammingExperience: command.hasProgrammingExperience,
      hasTechCourses: command.hasTechCourses,
      techCoursesList: command.techCoursesList,
    });

    student.changeParticipationData({
      sendCurriculum: command.sendCurriculum,
      fatilabMotivation: command.fatilabMotivation,
      howHeard: command.howHeard,
      hasComputer: command.hasComputer,
      hasInternet: command.hasInternet,
      committedToParticipate: command.committedToParticipate,
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
        command.disability.description,
        command.disability.hasReport,
        command.disability.type,
      );
      student.changeDisability(disability);
    }

    if (command.socialBenefits) {
      const benefits = command.socialBenefits.map(
        (benefit, index) =>
          new SocialBenefit(
            index + 1,
            student.id,
            benefit.benefit!,
            benefit.benefitOther,
          ),
      );
      student.replaceSocialBenefits(benefits);
    }

    if (command.accessibilityResources) {
      const resources = command.accessibilityResources.map(
        (resource, index) =>
          new AccessibilityResource(
            index + 1,
            student.id,
            resource.resource!,
            resource.resourceOther,
          ),
      );
      student.replaceAccessibilityResources(resources);
    }

    return this.studentRepository.update(student);
  }

  async deleteStudent(id: string): Promise<void> {
    const student = await this.getStudentById(id);
    await this.studentRepository.delete(student.id);
  }
}