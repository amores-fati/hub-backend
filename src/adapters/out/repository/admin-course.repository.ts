import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAdminCourseRepository } from '../../../core/ports/admin-course.repository.interface';
import { AdminCourse } from '../../../core/domain/admin-course.entity';
import { AdminCourseOrmEntity } from '../orm/admin-course.orm-entity';

@Injectable()
export class AdminCourseRepository implements IAdminCourseRepository {
  constructor(
    @InjectRepository(AdminCourseOrmEntity)
    private readonly ormRepository: Repository<AdminCourseOrmEntity>,
  ) {}

  async create(course: AdminCourse): Promise<AdminCourse> {
    const ormEntity = this.ormRepository.create(this.mapToOrm(course));
    const saved = await this.ormRepository.save(ormEntity);
    return this.mapToDomain(saved);
  }

  async findById(id: string): Promise<AdminCourse | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return this.mapToDomain(ormEntity);
  }

  async update(course: AdminCourse): Promise<AdminCourse> {
    const ormEntity = this.mapToOrm(course);
    const saved = await this.ormRepository.save(ormEntity);
    return this.mapToDomain(saved);
  }

  private mapToDomain(orm: AdminCourseOrmEntity): AdminCourse {
    return new AdminCourse(
      orm.id,
      orm.name,
      orm.description,
      orm.modality,
      orm.shift,
      orm.imageUrl ?? undefined,
      orm.address ?? undefined,
      orm.vacancyCount ?? undefined,
      orm.workloadHours ?? undefined,
      orm.startDate ? this.coerceDate(orm.startDate) : undefined,
      orm.endDate ? this.coerceDate(orm.endDate) : undefined,
      orm.enrollmentStart ? this.coerceDate(orm.enrollmentStart) : undefined,
      orm.enrollmentEnd ? this.coerceDate(orm.enrollmentEnd) : undefined,
    );
  }

  private mapToOrm(course: AdminCourse): AdminCourseOrmEntity {
    return {
      id: course.id,
      name: course.name,
      description: course.description,
      modality: course.modality,
      shift: course.shift,
      imageUrl: course.imageUrl ?? null,
      address: course.address ?? null,
      vacancyCount: course.vacancyCount ?? null,
      workloadHours: course.workloadHours ?? null,
      startDate: course.startDate ?? null,
      endDate: course.endDate ?? null,
      enrollmentStart: course.enrollmentStart ?? null,
      enrollmentEnd: course.enrollmentEnd ?? null,
      createdAt: new Date(),
    };
  }

  private coerceDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }
}
