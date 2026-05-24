import { Course } from '../domain/course.entity';

export const ICourseRepository = Symbol('ICourseRepository');

export interface CourseWithLocation {
  course: Course;
  location: string | null;
}

export interface CourseFilterQuery {
  search?: string;
  modality?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
}

export interface PaginatedCourseResult {
  items: CourseWithLocation[];
  total: number;
}

export interface ICourseRepository {
  create(course: Course): Promise<Course>;
  findAll(): Promise<Course[]>;
  findAllWithLocation(): Promise<CourseWithLocation[]>;
  findWithFilter(query: CourseFilterQuery): Promise<PaginatedCourseResult>;
  findById(id: string): Promise<Course | null>;
  delete(id: string): Promise<void>;
}
