import { randomUUID } from 'crypto';
import { CreateCourseCommand } from '../command/course.command';
import { Course } from '../domain/course.entity';
import { ICourseRepository } from '../ports/course.repository.interface';

export class CourseService {
  constructor(private readonly courseRepository: ICourseRepository) {}

  async createCourse(command: CreateCourseCommand): Promise<Course> {
    const course = new Course(
      randomUUID(),
      command.name,
      command.banner,
      command.courseLoad,
      new Date(command.startDate),
      new Date(command.endDate),
      new Date(command.startRegistrations),
      new Date(command.endRegistrations),
      command.linkAccess,
      command.description,
    );

    return this.courseRepository.create(course);
  }

  async getAllCourses(): Promise<Course[]> {
    return this.courseRepository.findAll();
  }
}
