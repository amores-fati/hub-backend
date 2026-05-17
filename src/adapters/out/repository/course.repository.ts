import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CourseWithLocation,
  ICourseRepository,
} from '../../../core/ports/course.repository.interface';
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
    const ormEntities = await this.ormRepository.find({
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map((entity) => this.mapToDomain(entity));
  }

  async findAllWithLocation(): Promise<CourseWithLocation[]> {
    const ormEntities = await this.ormRepository.find({
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map((entity) => ({
      course: this.mapToDomain(entity),
      location: entity.address ?? null,
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
      linkAccess: course.linkAccess ?? null,
      vacancyCount: course.vacancyCount,
      shift: course.shift ?? null,
      address: course.address ?? null,
    });
    const updated = await this.ormRepository.findOne({
      where: { id: course.id },
    });
    return this.mapToDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
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
      ormEntity.linkAccess ?? undefined,
      ormEntity.vacancyCount,
      ormEntity.shift ?? undefined,
      ormEntity.address ?? undefined,
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
      linkAccess: course.linkAccess ?? null,
      vacancyCount: course.vacancyCount,
      shift: course.shift ?? null,
      address: course.address ?? null,
      createdAt: new Date(),
    };
  }

  private coerceDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }
}
