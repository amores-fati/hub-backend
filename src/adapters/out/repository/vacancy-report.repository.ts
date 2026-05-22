import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';
import {
  IVacancyReportRepository,
  VacancyReportFilters,
  VacancyReportProjection,
} from '../../../core/ports/vacancy-report.repository.interface';
import { JobOpeningOrmEntity } from '../orm/job-opening.orm-entity';

@Injectable()
export class VacancyReportRepository implements IVacancyReportRepository {
  constructor(
    @InjectRepository(JobOpeningOrmEntity)
    private readonly ormRepository: Repository<JobOpeningOrmEntity>,
  ) {}

  async findManyByIds(ids: string[]): Promise<VacancyReportProjection[]> {
    if (ids.length === 0) {
      return [];
    }

    const ormEntities = await this.ormRepository.find({
      where: { id: In(ids) },
    });
    const entitiesById = new Map(
      ormEntities.map((entity) => [entity.id, entity]),
    );

    return ids
      .map((id) => entitiesById.get(id))
      .filter((entity): entity is JobOpeningOrmEntity => Boolean(entity))
      .map((entity) => this.mapToProjection(entity));
  }

  async findManyByFilters(
    filters: VacancyReportFilters = {},
  ): Promise<VacancyReportProjection[]> {
    const queryBuilder = this.ormRepository.createQueryBuilder('vacancy');

    this.applyFilters(queryBuilder, filters);

    const ormEntities = await queryBuilder
      .orderBy('vacancy.announcementDate', 'DESC')
      .addOrderBy('vacancy.name', 'ASC')
      .getMany();

    return ormEntities.map((entity) => this.mapToProjection(entity));
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<JobOpeningOrmEntity>,
    filters: VacancyReportFilters,
  ): void {
    const search = filters.search?.trim();
    if (search) {
      const searchFilter = this.buildLikeFilter(search);
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('vacancy.name ILIKE :search', {
            search: searchFilter,
          }).orWhere('vacancy.description ILIKE :search', {
            search: searchFilter,
          });
        }),
      );
    }

    if (typeof filters.isPcd === 'boolean') {
      queryBuilder.andWhere('vacancy.isPcd = :isPcd', {
        isPcd: filters.isPcd,
      });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('vacancy.announcementDate >= :dateFrom', {
        dateFrom: this.normalizeDateFilter(filters.dateFrom),
      });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('vacancy.announcementDate <= :dateTo', {
        dateTo: this.normalizeDateFilter(filters.dateTo),
      });
    }
  }

  private mapToProjection(
    ormEntity: JobOpeningOrmEntity,
  ): VacancyReportProjection {
    return {
      id: ormEntity.id,
      name: ormEntity.name,
      openingsCount: ormEntity.openingsCount,
      isPcd: ormEntity.isPcd,
      announcementDate: this.coerceDate(
        ormEntity.announcementDate as Date | string,
      ),
    };
  }

  private buildLikeFilter(value: string): string {
    return `%${value}%`;
  }

  private normalizeDateFilter(value: string): string {
    return new Date(value).toISOString().slice(0, 10);
  }

  private coerceDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(`${value}T00:00:00.000Z`);
  }
}
