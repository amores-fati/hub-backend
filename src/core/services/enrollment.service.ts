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

    if (type === EnrollmentType.ENROLLMENT && course.modality === 'online') {
      throw new DomainException(
        'Não é possível realizar matrícula direta em cursos da modalidade online.',
      );
    }

    const existing = await this.enrollmentRepository.findByStudentAndCourse(
      studentId,
      courseId,
    );
    if (existing) {
      throw new EnrollmentAlreadyExistsException();
    }

    course.decreaseVacancy();

    const enrollment = new Enrollment(
      randomUUID(),
      studentId,
      courseId,
      type,
      new Date(),
    );

    const created = await this.enrollmentRepository.create(enrollment);
    await this.courseRepository.update(course);
    
    return created;
  }

  private async unregister(
    studentId: string,
    courseId: string,
    type: EnrollmentType,
  ): Promise<void> {
    const existing = await this.enrollmentRepository.findByStudentAndCourse(
      studentId,
      courseId,
    );

    if (!existing || existing.type !== type) {
      throw new DomainException('Vínculo não encontrado.');
    }

    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new CourseNotFoundException(courseId);
    }

    await this.enrollmentRepository.delete(studentId, courseId);

    course.increaseVacancy();
    await this.courseRepository.update(course);
  }
}
