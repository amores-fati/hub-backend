import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  ILike,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import {
  CourseReportFilters,
  ICourseRepository,
} from '../../../core/ports/course.repository.interface';
import { Course } from '../../../core/domain/course.entity';
import { CourseStatus } from '../../../core/domain/course-status.enum';
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

  async findById(id: string): Promise<Course | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return this.mapToDomain(ormEntity);
  }
  async update(course: Course): Promise<Course> {
    await this.ormRepository.update(course.id, {
      name: course.name,
      banner: course.banner ?? null,
      bannerImage: course.bannerImage ?? null,
      bannerImageMimeType: course.bannerImageMimeType ?? null,
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

  async findManyByIds(ids: string[]): Promise<Course[]> {
    if (ids.length === 0) {
      return [];
    }

    const ormEntities = await this.ormRepository.find({
      where: { id: In(ids) },
      order: { createdAt: 'DESC' },
    });
    const entitiesById = new Map(
      ormEntities.map((entity) => [entity.id, entity]),
    );
    const orderedEntities = ids
      .map((id) => entitiesById.get(id))
      .filter((entity): entity is CourseOrmEntity => Boolean(entity));

    return orderedEntities.map((entity) => this.mapToDomain(entity));
  }

  async findManyByFilters(
    filters: CourseReportFilters = {},
  ): Promise<Course[]> {
    const where = this.buildFilterWhere(filters);
    const ormEntities = await this.ormRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return ormEntities.map((entity) => this.mapToDomain(entity));
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }

  async decreaseVacancy(courseId: string): Promise<boolean> {
    const result = await this.ormRepository
      .createQueryBuilder()
      .update(CourseOrmEntity)
      .set({ vacancyCount: () => 'vacancy_count - 1' })
      .where('id = :id', { id: courseId })
      .andWhere('vacancy_count > 0')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  async increaseVacancy(courseId: string): Promise<void> {
    await this.ormRepository
      .createQueryBuilder()
      .update(CourseOrmEntity)
      .set({ vacancyCount: () => 'vacancy_count + 1' })
      .where('id = :id', { id: courseId })
      .execute();
  }

  private mapToDomain(ormEntity: CourseOrmEntity): Course {
    return new Course(
      ormEntity.id,
      ormEntity.name,
      ormEntity.banner ?? undefined,
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
      this.normalizeStatus(ormEntity.status),
      ormEntity.bannerImage ?? undefined,
      ormEntity.bannerImageMimeType ?? undefined,
    );
  }

  private mapToOrm(course: Course): CourseOrmEntity {
    return {
      id: course.id,
      name: course.name,
      banner: course.banner ?? null,
      bannerImage: course.bannerImage ?? null,
      bannerImageMimeType: course.bannerImageMimeType ?? null,
      description: course.description ?? null,
      courseLoad: course.courseLoad,
      startDate: course.startDate,
      endDate: course.endDate,
      startRegistrations: course.startRegistrations,
      endRegistrations: course.endRegistrations,
      modality: course.modality,
      linkAccess: course.linkAccess ?? null,
      vacancyCount: course.vacancyCount,
      status: course.status,
      shift: course.shift ?? null,
      address: course.address ?? null,
      createdAt: new Date(),
    };
  }

  private coerceDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }

  private normalizeStatus(value?: string): CourseStatus {
    return Object.values(CourseStatus).includes(value as CourseStatus)
      ? (value as CourseStatus)
      : CourseStatus.ATIVO;
  }

  private buildFilterWhere(
    filters: CourseReportFilters,
  ): FindOptionsWhere<CourseOrmEntity> {
    const where: FindOptionsWhere<CourseOrmEntity> = {};

    const search = filters.search?.trim();
    if (search) {
      where.name = ILike(`%${search}%`);
    }

    const modality = filters.modality?.trim();
    if (modality) {
      where.modality = modality;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate) {
      where.startDate = MoreThanOrEqual(this.coerceDate(filters.startDate));
    }

    if (filters.endDate) {
      where.endDate = LessThanOrEqual(this.coerceDate(filters.endDate));
    }

    return where;
  }
}
