import { Course } from '../domain/course.entity';

export const ICourseRepository = Symbol('ICourseRepository');

export interface CourseWithLocation {
  course: Course;
  location: string | null;
}

export interface ICourseRepository {
  create(course: Course): Promise<Course>;
  findAll(): Promise<Course[]>;
  findAllWithLocation(): Promise<CourseWithLocation[]>;
  findById(id: string): Promise<Course | null>;
}
