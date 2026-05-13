import { randomUUID } from 'crypto';
import { AdminCourseCommand } from '../command/course.command';
import { AdminCourse } from '../domain/admin-course.entity';
import { CourseNotFoundException } from '../exceptions/course-not-found.exception';
import { IAdminCourseRepository } from '../ports/admin-course.repository.interface';

export class AdminCourseService {
  constructor(private readonly adminCourseRepository: IAdminCourseRepository) {}

  async createCourse(command: AdminCourseCommand): Promise<AdminCourse> {
    const course = new AdminCourse(
      randomUUID(),
      command.name,
      command.description,
      command.modality,
      command.shift,
      command.imageUrl,
      command.address,
      command.vacancyCount,
      command.workloadHours,
      command.startDate ? new Date(command.startDate) : undefined,
      command.endDate ? new Date(command.endDate) : undefined,
      command.enrollmentStart ? new Date(command.enrollmentStart) : undefined,
      command.enrollmentEnd ? new Date(command.enrollmentEnd) : undefined,
    );
    return this.adminCourseRepository.create(course);
  }

  async updateCourse(
    id: string,
    command: AdminCourseCommand,
  ): Promise<AdminCourse> {
    const course = await this.adminCourseRepository.findById(id);
    if (!course) {
      throw new CourseNotFoundException(id);
    }
    course.update(
      command.name,
      command.description,
      command.modality,
      command.shift,
      command.imageUrl,
      command.address,
      command.vacancyCount,
      command.workloadHours,
      command.startDate ? new Date(command.startDate) : undefined,
      command.endDate ? new Date(command.endDate) : undefined,
      command.enrollmentStart ? new Date(command.enrollmentStart) : undefined,
      command.enrollmentEnd ? new Date(command.enrollmentEnd) : undefined,
    );
    return this.adminCourseRepository.update(course);
  }
}
