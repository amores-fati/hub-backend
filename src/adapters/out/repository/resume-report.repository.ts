import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import {
  IResumeReportRepository,
  ResumeReportFilters,
  ResumeReportProjection,
} from '../../../core/ports/resume-report.repository.interface';
import { CurriculumOrmEntity } from '../orm/curriculum.orm-entity';

@Injectable()
export class ResumeReportRepository implements IResumeReportRepository {
  constructor(
    @InjectRepository(CurriculumOrmEntity)
    private readonly ormRepository: Repository<CurriculumOrmEntity>,
  ) {}

  async findManyByIds(ids: string[]): Promise<ResumeReportProjection[]> {
    if (ids.length === 0) {
      return [];
    }

    const ormEntities = await this.createBaseQueryBuilder()
      .andWhere('curriculum.id IN (:...ids)', { ids })
      .getMany();
    const entitiesById = new Map(
      ormEntities.map((entity) => [entity.id, entity]),
    );

    return ids
      .map((id) => entitiesById.get(id))
      .filter((entity): entity is CurriculumOrmEntity => Boolean(entity))
      .map((entity) => this.mapToProjection(entity));
  }

  async findManyByFilters(
    filters: ResumeReportFilters = {},
  ): Promise<ResumeReportProjection[]> {
    const queryBuilder = this.createBaseQueryBuilder();

    this.applyFilters(queryBuilder, filters);

    const ormEntities = await queryBuilder
      .orderBy('student.fullName', 'ASC')
      .addOrderBy('curriculum.id', 'ASC')
      .getMany();

    return ormEntities.map((entity) => this.mapToProjection(entity));
  }

  private createBaseQueryBuilder(): SelectQueryBuilder<CurriculumOrmEntity> {
    return this.ormRepository
      .createQueryBuilder('curriculum')
      .innerJoinAndSelect('curriculum.student', 'student')
      .innerJoinAndSelect('student.user', 'user', 'user.deletedAt IS NULL');
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<CurriculumOrmEntity>,
    filters: ResumeReportFilters,
  ): void {
    const search = filters.search?.trim();
    if (search) {
      const searchFilter = this.buildLikeFilter(search);
      const normalizedCpf = this.normalizeCpf(search);

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('student.socialName ILIKE :search', {
            search: searchFilter,
          })
            .orWhere('student.fullName ILIKE :search', {
              search: searchFilter,
            })
            .orWhere('user.email ILIKE :search', {
              search: searchFilter,
            })
            .orWhere('curriculum.about ILIKE :search', {
              search: searchFilter,
            });

          if (normalizedCpf) {
            qb.orWhere(
              "regexp_replace(student.cpf, '\\D', '', 'g') ILIKE :cpf",
              { cpf: this.buildLikeFilter(normalizedCpf) },
            );
          }
        }),
      );
    }

    const interestArea = filters.interestArea?.trim();
    if (interestArea) {
      queryBuilder.andWhere('student.activityArea ILIKE :interestArea', {
        interestArea: this.buildLikeFilter(interestArea),
      });
    }

    const preference = filters.preference?.trim();
    if (preference) {
      queryBuilder.andWhere('curriculum.preference ILIKE :preference', {
        preference: this.buildLikeFilter(preference),
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('curriculum.isAvailable = :isAvailable', {
        isAvailable: filters.status === 'ATIVO',
      });
    }
  }

  private mapToProjection(
    ormEntity: CurriculumOrmEntity,
  ): ResumeReportProjection {
    return {
      id: ormEntity.id,
      studentName: ormEntity.student.fullName,
      socialName: ormEntity.student.socialName || undefined,
      cpf: ormEntity.student.cpf,
      interestArea: ormEntity.student.activityArea || undefined,
      preference: ormEntity.preference || undefined,
      isAvailable: ormEntity.isAvailable,
    };
  }

  private buildLikeFilter(value: string): string {
    return `%${value}%`;
  }

  private normalizeCpf(value: string): string | undefined {
    const digits = value.replace(/\D/g, '');
    return digits ? digits : undefined;
  }
}
