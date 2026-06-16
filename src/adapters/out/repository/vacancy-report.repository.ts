import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';
import {
  AdminVacancyFilters,
  AdminVacancyListItem,
  IVacancyReportRepository,
  MyVacanciesFilters,
  PaginatedAdminVacanciesResult,
  MyVacancyProjection,
  PaginatedVacanciesResult,
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

  async findCompanyIdById(id: string): Promise<string | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    return ormEntity ? (ormEntity.company?.id ?? null) : null;
  }

  async deleteById(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }

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

  async findMyVacancies(
    filters: MyVacanciesFilters,
  ): Promise<PaginatedVacanciesResult> {
    const { companyId, search, vacancyCount, isPcd, workplaceType, page, limit } = filters;
    const qb = this.ormRepository
      .createQueryBuilder('vacancy')
      .innerJoinAndSelect('vacancy.company', 'company')
      .leftJoinAndSelect('vacancy.skills', 'jobSkill')
      .leftJoinAndSelect('jobSkill.skill', 'skill')
      .where('company.id = :companyId', { companyId });

    if (search) {
      qb.andWhere('vacancy.name ILIKE :search', { search: `%${search}%` });
    }

    if (vacancyCount !== undefined) {
      qb.andWhere('vacancy.openingsCount = :vacancyCount', {
        vacancyCount,
      });
    }

    if (isPcd !== undefined) {
      qb.andWhere('vacancy.isPcd = :isPcd', { isPcd });
    }

    if (workplaceType !== undefined) {
      qb.andWhere('vacancy.workplaceType = :workplaceType', { workplaceType });
    }

    const total = await qb.getCount();
    const ormEntities = await qb
      .orderBy('vacancy.announcementDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: ormEntities.map((e) => this.mapToMyVacancyProjection(e)),
      total,
      page,
      limit,
    };
  }

  async findAllForAdmin(
    filters: AdminVacancyFilters,
  ): Promise<PaginatedAdminVacanciesResult> {
    const { search, isPcd, workType, page, limit } = filters;

    const qb = this.ormRepository
      .createQueryBuilder('vacancy')
      .innerJoinAndSelect('vacancy.company', 'company');

    if (search) {
      const searchFilter = this.buildLikeFilter(search.trim());
      qb.andWhere(
        new Brackets((qb2) => {
          qb2
            .where('vacancy.name ILIKE :search', { search: searchFilter })
            .orWhere('company.name ILIKE :search', { search: searchFilter });
        }),
      );
    }

    if (typeof isPcd === 'boolean') {
      qb.andWhere('vacancy.isPcd = :isPcd', { isPcd });
    }

    if (workType) {
      qb.andWhere('vacancy.workplaceType ILIKE :workType', { workType });
    }

    const total = await qb.getCount();
    const ormEntities = await qb
      .orderBy('vacancy.announcementDate', 'DESC')
      .addOrderBy('vacancy.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items: ormEntities.map((e) => this.mapToAdminListItem(e)),
      total,
    };
  }

  private mapToAdminListItem(
    ormEntity: JobOpeningOrmEntity,
  ): AdminVacancyListItem {
    return {
      id: ormEntity.id,
      name: ormEntity.name,
      companyName: ormEntity.company?.name ?? '',
      openingsCount: ormEntity.openingsCount,
      isPcd: ormEntity.isPcd,
      announcementDate: this.coerceDate(
        ormEntity.announcementDate as Date | string,
      ),
      workplaceType: ormEntity.workplaceType,
    };
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

  private mapToMyVacancyProjection(
    ormEntity: JobOpeningOrmEntity,
  ): MyVacancyProjection {
    return {
      id: ormEntity.id,
      companyId: ormEntity.company.id,
      name: ormEntity.name,
      description: ormEntity.description,
      openingsCount: ormEntity.openingsCount,
      applicationLink: ormEntity.applicationLink,
      workplaceType: ormEntity.workplaceType,
      isPcd: ormEntity.isPcd,
      announcementDate: this.coerceDate(
        ormEntity.announcementDate as Date | string,
      ),
      skills: (ormEntity.skills ?? []).map((js) => ({
        id: js.skill.id,
        name: js.skill.name,
      })),
    };
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
