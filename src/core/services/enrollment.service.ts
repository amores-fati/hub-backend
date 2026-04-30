import { randomUUID } from 'crypto';
import { Enrollment, EnrollmentType } from '../domain/enrollment.entity';
import { CourseNotFoundException } from '../exceptions/course-not-found.exception';
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

  async registerInterest(studentId: string, courseId: string): Promise<Enrollment> {
    return this.register(studentId, courseId, EnrollmentType.INTEREST);
  }

  async enroll(studentId: string, courseId: string): Promise<Enrollment> {
    return this.register(studentId, courseId, EnrollmentType.ENROLLMENT);
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

    const existing = await this.enrollmentRepository.findByStudentAndCourse(studentId, courseId);
    if (existing) {
      throw new EnrollmentAlreadyExistsException();
    }

    const enrollment = new Enrollment(
      randomUUID(),
      studentId,
      courseId,
      type,
      new Date(),
    );

    return this.enrollmentRepository.create(enrollment);
  }
}
