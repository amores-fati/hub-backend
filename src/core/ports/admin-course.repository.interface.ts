import { AdminCourse } from '../domain/admin-course.entity';

export const IAdminCourseRepository = Symbol('IAdminCourseRepository');

export interface IAdminCourseRepository {
  create(course: AdminCourse): Promise<AdminCourse>;
  findById(id: string): Promise<AdminCourse | null>;
  update(course: AdminCourse): Promise<AdminCourse>;
}
