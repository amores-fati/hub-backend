import { Course } from '../domain/course.entity';
import { ICourseRepository } from '../ports/course.repository.interface';
import { randomUUID } from 'crypto';

export class CourseService {
  constructor(private readonly courseRepository: ICourseRepository) {}

  async createCourse(title: string, description: string): Promise<Course> {
    const course = new Course(
      randomUUID(),
      title,
      description,
      new Date(),
      new Date(),
    );
    return this.courseRepository.create(course);
  }

  async getAllCourses(): Promise<Course[]> {
    return this.courseRepository.findAll();
  }
}
