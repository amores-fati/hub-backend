import { randomUUID } from 'crypto';
import { Enrollment, EnrollmentType } from '../domain/enrollment.entity';
import { CourseNotFoundException } from '../exceptions/course-not-found.exception';
import { DomainException } from '../exceptions/domain.exception';
import { EnrollmentAlreadyExistsException } from '../exceptions/enrollment-already-exists.exception';
import { ICourseRepository } from '../ports/course.repository.interface';
import { IEnrollmentRepository } from '../ports/enrollment.repository.interface';

export class EnrollmentService {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly courseRepository: ICourseRepository,
  ) {}

  async getEnrollmentsByStudentId(studentId: string): Promise<Enrollment[]> {
    return this.enrollmentRepository.findByStudentId(studentId);
  }

  async registerInterest(
    studentId: string,
    courseId: string,
  ): Promise<Enrollment> {
    return this.register(studentId, courseId, EnrollmentType.INTEREST);
  }

  async enroll(studentId: string, courseId: string): Promise<Enrollment> {
    return this.register(studentId, courseId, EnrollmentType.ENROLLMENT);
  }

  async removeInterest(studentId: string, courseId: string): Promise<void> {
    return this.unregister(studentId, courseId, EnrollmentType.INTEREST);
  }

  async unenroll(studentId: string, courseId: string): Promise<void> {
    return this.unregister(studentId, courseId, EnrollmentType.ENROLLMENT);
  }

  private async register(
    studentId: string,
    courseId: string,
    type: EnrollmentType,
  ): Promise<Enrollment> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new CourseNotFoundException(courseId);
    }

    if (
      type === EnrollmentType.ENROLLMENT &&
      course.modality?.toLowerCase() === 'online'
    ) {
      throw new DomainException(
        'Não é possível realizar matrícula direta em cursos da modalidade online.',
      );
    }

    const existing = await this.enrollmentRepository.findByStudentAndCourse(
      studentId,
      courseId,
      type,
    );
    if (existing) {
      throw new EnrollmentAlreadyExistsException();
    }

    // Apenas a matrícula efetiva (INSCRICAO) consome uma vaga do curso.
    // A reserva é atômica no banco para evitar corrida e estouro de vagas.
    if (type === EnrollmentType.ENROLLMENT) {
      const reserved = await this.courseRepository.decreaseVacancy(courseId);
      if (!reserved) {
        throw new DomainException(
          'Não há vagas disponíveis para este curso.',
        );
      }
    }

    const enrollment = new Enrollment(
      randomUUID(),
      studentId,
      courseId,
      type,
      new Date(),
    );

    try {
      return await this.enrollmentRepository.create(enrollment);
    } catch (error) {
      // Se a criação falhar (ex.: corrida na unique key), devolve a vaga reservada.
      if (type === EnrollmentType.ENROLLMENT) {
        await this.courseRepository.increaseVacancy(courseId);
      }
      throw error;
    }
  }

  private async unregister(
    studentId: string,
    courseId: string,
    type: EnrollmentType,
  ): Promise<void> {
    const existing = await this.enrollmentRepository.findByStudentAndCourse(
      studentId,
      courseId,
      type,
    );

    if (!existing) {
      throw new DomainException('Vínculo não encontrado.');
    }

    await this.enrollmentRepository.delete(studentId, courseId, type);

    // Só devolve vaga quem efetivamente a consumiu (INSCRICAO).
    if (type === EnrollmentType.ENROLLMENT) {
      await this.courseRepository.increaseVacancy(courseId);
    }
  }
}
