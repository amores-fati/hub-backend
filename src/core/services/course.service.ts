import { randomUUID } from 'crypto';
import {
  CreateCourseCommand,
  UpdateCourseCommand,
} from '../command/course.command';
import { Course } from '../domain/course.entity';
import {
  CourseReportFilters,
  ICourseRepository,
} from '../ports/course.repository.interface';
import { CourseNotFoundException } from '../exceptions/course-not-found.exception';

export interface FilterCoursesCommand extends CourseReportFilters {
  page: number;
  limit: number;
}

export interface PaginatedCoursesResponse {
  data: Course[];
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
      command.shift,
      command.address,
      command.description,
      command.status,
      command.bannerImage,
      command.bannerImageMimeType,
    );

    return this.courseRepository.create(course);
  }

  async updateCourse(
    id: string,
    command: UpdateCourseCommand,
  ): Promise<Course> {
    const existing = await this.courseRepository.findById(id);
    if (!existing) {
      const error = new Error('Curso não encontrado');
      error.name = 'CourseNotFoundException';
      throw error;
    }

    const updated = new Course(
      id,
      command.name,
      command.banner ?? existing.banner,
      command.courseLoad,
      new Date(command.startDate),
      new Date(command.endDate),
      new Date(command.startRegistrations),
      new Date(command.endRegistrations),
      command.modality,
      command.linkAccess,
      command.vacancyCount,
      command.shift,
      command.address,
      command.description,
      command.status ?? existing.status,
      command.bannerImage ?? existing.bannerImage,
      command.bannerImageMimeType ?? existing.bannerImageMimeType,
    );

    return this.courseRepository.update(updated);
  }

  async filterCourses(
    command: FilterCoursesCommand,
  ): Promise<PaginatedCoursesResponse> {
    const { page, limit, ...filters } = command;
    const all = await this.courseRepository.findManyByFilters(filters);
    const total = all.length;
    const data = all.slice((page - 1) * limit, page * limit);
    return { data, total, page, limit };
  }

  async getAllCourses(): Promise<Course[]> {
    return this.courseRepository.findAll();
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
