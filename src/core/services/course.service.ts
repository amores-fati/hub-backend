import { randomUUID } from 'crypto';
import { CreateCourseCommand } from '../command/course.command';
import { FilterCourseCommand } from '../command/filter-course.command';
import { Course } from '../domain/course.entity';
import {
  CourseWithLocation,
  ICourseRepository,
} from '../ports/course.repository.interface';
import { CourseNotFoundException } from '../exceptions/course-not-found.exception';

export interface PaginatedCoursesResponse {
  data: CourseWithLocation[];
  total: number;
  page: number;
  limit: number;
}

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
      command.modality,
      command.linkAccess,
      command.vacancyCount,
      command.description,
    );

    return this.courseRepository.create(course);
  }

  async getAllCourses(): Promise<Course[]> {
    return this.courseRepository.findAll();
  }

  async filterCourses(command: FilterCourseCommand): Promise<PaginatedCoursesResponse> {
    const page = command.page ?? 1;
    const limit = command.limit ?? 10;

    const result = await this.courseRepository.findWithFilter({
      search: command.search,
      modality: command.modality,
      startDate: command.startDate ? new Date(command.startDate) : undefined,
      endDate: command.endDate ? new Date(command.endDate) : undefined,
      page,
      limit,
    });

    return {
      data: result.items,
      total: result.total,
      page,
      limit,
    };
  }

  async getAllCoursesWithLocation(): Promise<CourseWithLocation[]> {
    return this.courseRepository.findAllWithLocation();
  }

  async findCourseById(id: string): Promise<Course> {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new CourseNotFoundException(id);
    return course;
  }

  async deleteCourse(id: string): Promise<void> {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new CourseNotFoundException(id);
    await this.courseRepository.delete(id);
  }
}
