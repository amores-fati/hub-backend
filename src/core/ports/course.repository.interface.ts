import { Course } from '../domain/course.entity';
import { CourseStatus } from '../domain/course-status.enum';

export const ICourseRepository = Symbol('ICourseRepository');

export interface CourseWithLocation {
  course: Course;
  location: string | null;
}

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
  findAllWithLocation(): Promise<CourseWithLocation[]>;
  findById(id: string): Promise<Course | null>;
  findManyByIdsWithLocation(ids: string[]): Promise<CourseWithLocation[]>;
  findManyWithLocationByFilters(
    filters?: CourseReportFilters,
  ): Promise<CourseWithLocation[]>;
  update(course: Course): Promise<Course>;
  delete(id: string): Promise<void>;
}
