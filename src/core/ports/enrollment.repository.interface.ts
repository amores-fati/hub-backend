import { Enrollment } from '../domain/enrollment.entity';

export const IEnrollmentRepository = Symbol('IEnrollmentRepository');

export interface IEnrollmentRepository {
  findByStudentId(studentId: string): Promise<Enrollment[]>;
  findByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<Enrollment | null>;
  create(enrollment: Enrollment): Promise<Enrollment>;
}
