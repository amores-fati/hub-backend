import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CourseWithLocation,
  ICourseRepository,
} from '../../../core/ports/course.repository.interface';
import { Course } from '../../../core/domain/course.entity';
import { CourseOrmEntity } from '../orm/course.orm-entity';
import { InPersonCourseDetailOrmEntity } from '../orm/in-person-course-detail.orm-entity';

@Injectable()
export class CourseRepository implements ICourseRepository {
  constructor(
    @InjectRepository(CourseOrmEntity)
    private readonly ormRepository: Repository<CourseOrmEntity>,
    @InjectRepository(InPersonCourseDetailOrmEntity)
    private readonly inPersonDetailRepository: Repository<InPersonCourseDetailOrmEntity>,
  ) {}

  async create(course: Course): Promise<Course> {
    const ormEntity = this.ormRepository.create(this.mapToOrm(course));
    const savedEntity = await this.ormRepository.save(ormEntity);
    return this.mapToDomain(savedEntity);
  }

  async findAll(): Promise<Course[]> {
    const ormEntities = await this.ormRepository.find({
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map((entity) => this.mapToDomain(entity));
  }

  async findAllWithLocation(): Promise<CourseWithLocation[]> {
    const ormEntities = await this.ormRepository.find({
      order: { createdAt: 'DESC' },
    });
    const details = await this.inPersonDetailRepository.find({
      relations: { course: true },
    });
    const addressByCourseId = new Map<string, string>();
    for (const detail of details) {
      if (detail.course?.id) {
        addressByCourseId.set(detail.course.id, detail.address);
      }
    }
    return ormEntities.map((entity) => ({
      course: this.mapToDomain(entity),
      location: addressByCourseId.get(entity.id) ?? null,
    }));
  }

  async findById(id: string): Promise<Course | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return this.mapToDomain(ormEntity);
  }

  async update(course: Course): Promise<Course> {
    await this.ormRepository.update(course.id, {
      name: course.name,
      banner: course.banner,
      description: course.description ?? null,
      courseLoad: course.courseLoad,
      startDate: course.startDate,
      endDate: course.endDate,
      startRegistrations: course.startRegistrations,
      endRegistrations: course.endRegistrations,
      modality: course.modality,
      linkAccess: course.linkAccess,
      vacancyCount: course.vacancyCount,
    });
    const updated = await this.ormRepository.findOne({
      where: { id: course.id },
    });
    return this.mapToDomain(updated!);
  }

  private mapToDomain(ormEntity: CourseOrmEntity): Course {
    return new Course(
      ormEntity.id,
      ormEntity.name,
      ormEntity.banner,
      ormEntity.courseLoad,
      this.coerceDate(ormEntity.startDate),
      this.coerceDate(ormEntity.endDate),
      this.coerceDate(ormEntity.startRegistrations),
      this.coerceDate(ormEntity.endRegistrations),
      ormEntity.modality,
      ormEntity.linkAccess,
      ormEntity.vacancyCount,
      ormEntity.description ?? undefined,
    );
  }

  private mapToOrm(course: Course): CourseOrmEntity {
    return {
      id: course.id,
      name: course.name,
      banner: course.banner,
      description: course.description ?? null,
      courseLoad: course.courseLoad,
      startDate: course.startDate,
      endDate: course.endDate,
      startRegistrations: course.startRegistrations,
      endRegistrations: course.endRegistrations,
      modality: course.modality,
      linkAccess: course.linkAccess,
      vacancyCount: course.vacancyCount,
      createdAt: new Date(),
    };
  }

  private coerceDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }
}
