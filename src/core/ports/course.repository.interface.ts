import { Course } from '../domain/course.entity';

export const ICourseRepository = Symbol('ICourseRepository');

export interface ICourseRepository {
  create(course: Course): Promise<Course>;
  findAll(): Promise<Course[]>;
}
