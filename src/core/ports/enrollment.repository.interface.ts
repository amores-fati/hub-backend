import { Enrollment, EnrollmentType } from '../domain/enrollment.entity';

export const IEnrollmentRepository = Symbol('IEnrollmentRepository');

export interface IEnrollmentRepository {
  findByStudentId(studentId: string): Promise<Enrollment[]>;
  findByStudentAndCourse(
    studentId: string,
    courseId: string,
    type: EnrollmentType,
  ): Promise<Enrollment | null>;
  create(enrollment: Enrollment): Promise<Enrollment>;
  delete(
    studentId: string,
    courseId: string,
    type: EnrollmentType,
  ): Promise<void>;
}
