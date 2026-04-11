import { randomUUID } from 'crypto';
import { Student } from '../domain/student.entity';
import { IStudentRepository } from '../ports/student.repository.interface';
import { StudentAlreadyExistsException } from '../exceptions/student-already-exists.exception';

export class StudentService {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async createStudent(
    name: string,
    socialName: string | undefined,
    cpf: string,
    birthDate: string,
    phone: string,
    email: string,
    password: string,
    gender: string,
    race: string,
    cep: string,
    address: string | undefined,
    complement: string | undefined,
    neighborhood: string | undefined,
    city: string | undefined,
    state: string | undefined,
    education: string,
    courseName: string | undefined,
    institution: string | undefined,
    fatilabMotivation: string,
    howHeard: string | undefined,
    hasComputer: boolean | undefined,
    hasInternet: boolean | undefined,
    committedToParticipate: boolean | undefined,
    familyIncome: string | undefined,
    householdSize: number | undefined,
    socialBenefits: string | undefined,
    hasProgrammingExperience: boolean | undefined,
    hasTechCourses: boolean | undefined,
    techCoursesList: string | undefined,
    isEmployed: boolean | undefined,
    workArea: string | undefined,
    isPcd: boolean,
    disabilityType: string | undefined,
    disabilityDescription: string | undefined,
    hasMedicalReport: string | undefined,
    accessibilityResources: string | undefined,
    specificAccessibilityNeeds: string | undefined,
    authorizesImageUse: boolean,
    acceptsLgpd: boolean,
  ): Promise<Student> {
    const existingStudent = await this.studentRepository.findByCpf(cpf);

    if (existingStudent) {
      throw new StudentAlreadyExistsException(cpf);
    }

    console.log(password); // temporary fix

    const student = new Student(
      randomUUID(),
      name,
      socialName ?? null,
      cpf,
      new Date(birthDate),
      phone,
      email,
      password,
      gender,
      race,
      cep ?? null,
      address ?? null,
      complement ?? null,
      neighborhood ?? null,
      city ?? null,
      state ?? null,
      education,
      courseName ?? null,
      institution ?? null,
      fatilabMotivation,
      howHeard ?? null,
      hasComputer ?? null,
      hasInternet ?? null,
      committedToParticipate ?? null,
      familyIncome ?? null,
      householdSize ?? null,
      socialBenefits ?? null,
      hasProgrammingExperience ?? null,
      hasTechCourses ?? null,
      techCoursesList ?? null,
      isEmployed ?? null,
      workArea ?? null,
      isPcd,
      disabilityType ?? null,
      disabilityDescription ?? null,
      hasMedicalReport ?? null,
      accessibilityResources ?? null,
      specificAccessibilityNeeds ?? null,
      authorizesImageUse,
      acceptsLgpd,
      false,
      new Date(),
      new Date(),
    );

    return this.studentRepository.create(student);
  }

  async findAllStudents(): Promise<Student[]> {
    return this.studentRepository.findAll();
  }

  async getStudentById(id: string): Promise<Student | null> {
    return this.studentRepository.findById(id);
  }

  async getStudentByCpf(cpf: string): Promise<Student | null> {
    return this.studentRepository.findByCpf(cpf);
  }
}