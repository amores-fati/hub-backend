import { Course } from '../domain/course.entity';

export const ICourseRepository = Symbol('ICourseRepository');

export interface CourseRepository {
  create(course: Course): Promise<Course>;
  findAll(): Promise<Course[]>;
  countVacancies(): Promise<number>;
  studentsPerCourse(): Promise<{ courseId: string; studentCount: number }[]>;
  coursesTimeline(): Promise<{ data: string; type: number }[]>;
}
