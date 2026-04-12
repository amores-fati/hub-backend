import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICourseRepository } from '../../../core/ports/course.repository.interface';
import { Course } from '../../../core/domain/course.entity';
import { CourseOrmEntity } from '../orm/course.orm-entity';

@Injectable()
export class CourseRepository implements ICourseRepository {
  constructor(
    @InjectRepository(CourseOrmEntity)
    private readonly ormRepository: Repository<CourseOrmEntity>,
  ) {}

  async create(course: Course): Promise<Course> {
    const ormEntity = this.ormRepository.create(this.mapToOrm(course));
    const savedEntity = await this.ormRepository.save(ormEntity);
    return this.mapToDomain(savedEntity);
  }

  async findAll(): Promise<Course[]> {
    const ormEntities = await this.ormRepository.find();
    return ormEntities.map((entity) => this.mapToDomain(entity));
  }

  private mapToDomain(ormEntity: CourseOrmEntity): Course {
    return new Course(
      ormEntity.id,
      ormEntity.name,
      ormEntity.banner,
      ormEntity.course_load,
      ormEntity.start_date,
      ormEntity.end_date,
      ormEntity.start_registrations,
      ormEntity.end_registrations,
      ormEntity.link_access,
      ormEntity.description ?? undefined,
    );
  }

  private mapToOrm(course: Course): CourseOrmEntity {
    return {
      id: course.id,
      name: course.name,
      banner: course.banner,
      description: course.description ?? null,
      course_load: course.courseLoad,
      start_date: course.startDate,
      end_date: course.endDate,
      start_registrations: course.startRegistrations,
      end_registrations: course.endRegistrations,
      link_access: course.linkAccess,
    };
  }
}
