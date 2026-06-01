import { Course } from '../domain/course.entity';
import { CourseStatus } from '../domain/course-status.enum';

export const ICourseRepository = Symbol('ICourseRepository');

export interface CourseReportFilters {
  search?: string;
  modality?: string;
  status?: CourseStatus;
  startDate?: string;
  endDate?: string;
}

export interface ICourseRepository {
  create(course: Course): Promise<Course>;
  findAll(): Promise<Course[]>;
  findById(id: string): Promise<Course | null>;
  findManyByIds(ids: string[]): Promise<Course[]>;
  findManyByFilters(filters?: CourseReportFilters): Promise<Course[]>;
  update(course: Course): Promise<Course>;
  delete(id: string): Promise<void>;
}
