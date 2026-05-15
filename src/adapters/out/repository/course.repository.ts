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
  CourseWithLocation,
  ICourseRepository,
} from '../../../core/ports/course.repository.interface';
import { Course } from '../../../core/domain/course.entity';
import { CourseStatus } from '../../../core/domain/course-status.enum';
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
    return this.mapToCoursesWithLocation(ormEntities);
  }

  async findById(id: string): Promise<Course | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return this.mapToDomain(ormEntity);
  }

  async findManyByIdsWithLocation(
    ids: string[],
  ): Promise<CourseWithLocation[]> {
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

    return this.mapToCoursesWithLocation(orderedEntities);
  }

  async findManyWithLocationByFilters(
    filters: CourseReportFilters = {},
  ): Promise<CourseWithLocation[]> {
    const where = this.buildFilterWhere(filters);
    const ormEntities = await this.ormRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return this.mapToCoursesWithLocation(ormEntities);
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
      ormEntity.linkAccess,
      ormEntity.vacancyCount,
      ormEntity.description ?? undefined,
      this.normalizeStatus(ormEntity.status),
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
      status: course.status,
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

  private async mapToCoursesWithLocation(
    ormEntities: CourseOrmEntity[],
  ): Promise<CourseWithLocation[]> {
    const courseIds = ormEntities.map((entity) => entity.id);
    const details =
      courseIds.length > 0
        ? await this.inPersonDetailRepository.find({
            where: { course: { id: In(courseIds) } },
            relations: { course: true },
          })
        : [];
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
}
