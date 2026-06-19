import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import {
  ICompanyRepository,
  CompanyFilterOptions,
  CompanyReportProjection,
  CompanyWithStatus,
} from '../../../core/ports/company.repository.interface';
import { Company } from '../../../core/domain/company.entity';
import { CompanyOrmEntity } from '../orm/company.orm-entity';
import { Contact } from '../../../core/domain/contact.entity';
import { UserOrmEntity } from '../orm/user.orm-entity';
import { TelephoneCompanyOrmEntity } from '../orm/telephone-company.orm-entity';
import { AddressCompanyOrmEntity } from '../orm/address-company.orm-entity';
import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';
import { CompanyStatus } from '../../../core/domain/company-status.enum';

interface CompanyListRawRow {
  c_id: string;
  c_cnpj: string;
  c_name: string;
  c_responsible_name: string;
  u_email: string;
  u_password_hash: string;
  u_deleted_at: Date | null;
  t_id: string;
  t_phone: string;
  a_id: string;
  a_neighbourhood: string | null;
  a_state: string | null;
  a_city: string | null;
  a_address: string | null;
  a_cep: string;
  a_complement: string | null;
}

interface CompanyReportRawRow {
  c_id: string;
  c_cnpj: string;
  c_name: string;
  u_email: string;
  u_created_at: Date | string;
  u_deleted_at: Date | string | null;
  t_phone: string;
  a_neighbourhood: string | null;
  a_state: string | null;
  a_city: string | null;
}

@Injectable()
export class CompanyRepository implements ICompanyRepository {
  constructor(
    @InjectRepository(CompanyOrmEntity)
    private readonly ormRepository: Repository<CompanyOrmEntity>,
  ) {}

  async create(company: Company): Promise<Company> {
    const ormEntity = this.mapToOrm(company);

    await this.ormRepository.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.save(ormEntity.user);
        await transactionalEntityManager.save(ormEntity);
      },
    );

    return this.mapToDomain(ormEntity);
  }

  async findAll(): Promise<Company[]> {
    const ormEntities = await this.ormRepository.find({
      relations: ['user', 'telephone', 'address'],
    });
    return ormEntities.map((e) => this.mapToDomain(e));
  }

  async findById(id: string): Promise<Company | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id },
      relations: ['user', 'telephone', 'address'],
    });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async existsById(id: string): Promise<boolean> {
    return this.ormRepository.exists({ where: { id } });
  }

  async findByCnpj(cnpj: string): Promise<Company | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { cnpj },
      relations: ['user', 'telephone', 'address'],
    });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async update(company: Company): Promise<Company> {
    const ormEntity = this.mapToOrm(company);

    await this.ormRepository.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.save(ormEntity.user);
        await transactionalEntityManager.save(ormEntity);
      },
    );

    return this.mapToDomain(ormEntity);
  }

  async delete(id: string): Promise<void> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id },
      relations: ['user', 'telephone', 'address'],
    });

    if (ormEntity) {
      await this.ormRepository.manager.transaction(
        async (transactionalEntityManager) => {
          if (ormEntity.telephone) {
            await transactionalEntityManager.remove(ormEntity.telephone);
          }

          if (ormEntity.address) {
            await transactionalEntityManager.remove(ormEntity.address);
          }

          await transactionalEntityManager.remove(ormEntity);

          if (ormEntity.user) {
            await transactionalEntityManager.remove(ormEntity.user);
          }
        },
      );
    }
  }

  private mapToOrm(company: Company): CompanyOrmEntity {
    const ormEntity = new CompanyOrmEntity();
    ormEntity.id = company.id;
    ormEntity.cnpj = company.cnpj;
    ormEntity.name = company.name;
    ormEntity.responsibleName = company.responsibleName;

    ormEntity.user = new UserOrmEntity();
    ormEntity.user.id = company.id;
    ormEntity.user.email = company.email;
    ormEntity.user.password = company.password;
    ormEntity.user.role = UserRoleEnum.COMPANY;

    ormEntity.telephone = new TelephoneCompanyOrmEntity();
    ormEntity.telephone.id = company.id;
    ormEntity.telephone.companyId = company.id;
    ormEntity.telephone.phone = company.contact.phone;

    ormEntity.address = new AddressCompanyOrmEntity();
    ormEntity.address.id = company.id;
    ormEntity.address.companyId = company.id;
    ormEntity.address.city = company.contact.city || null;
    ormEntity.address.state = company.contact.state || null;
    ormEntity.address.neighbourhood = company.contact.neighbourhood || null;
    ormEntity.address.address = company.contact.address || null;
    ormEntity.address.cep = company.contact.cep!;
    ormEntity.address.complement = company.contact.complement || null;

    return ormEntity;
  }

  private mapToDomain(ormEntity: CompanyOrmEntity): Company {
    const contact = new Contact(
      ormEntity.telephone.id,
      ormEntity.telephone.phone,
      ormEntity.address.neighbourhood || undefined,
      ormEntity.address.state || undefined,
      ormEntity.address.city || undefined,
      ormEntity.address.address || undefined,
      ormEntity.address.cep,
      ormEntity.address.complement || undefined,
    );

    return new Company(
      ormEntity.id,
      ormEntity.user.email,
      ormEntity.user.password,
      ormEntity.name,
      ormEntity.cnpj,
      ormEntity.responsibleName,
      contact,
    );
  }

  async findManyByFilters(
    filters: CompanyFilterOptions = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: CompanyWithStatus[]; total: number }> {
    const qb = this.createCompanyBaseQueryBuilder()
      .select('company.id', 'c_id')
      .addSelect('company.cnpj', 'c_cnpj')
      .addSelect('company.name', 'c_name')
      .addSelect('company.responsibleName', 'c_responsible_name')
      .addSelect('user.email', 'u_email')
      .addSelect('user.password_hash', 'u_password_hash')
      .addSelect('user.deleted_at', 'u_deleted_at')
      .addSelect('telephone.id', 't_id')
      .addSelect('telephone.phone', 't_phone')
      .addSelect('address.id', 'a_id')
      .addSelect('address.neighbourhood', 'a_neighbourhood')
      .addSelect('address.state', 'a_state')
      .addSelect('address.city', 'a_city')
      .addSelect('address.address', 'a_address')
      .addSelect('address.cep', 'a_cep')
      .addSelect('address.complement', 'a_complement');

    this.applyCompanyFilters(qb, filters);

    const total = await qb.getCount();

    qb.orderBy('company.name', 'ASC')
      .offset((page - 1) * limit)
      .limit(limit);

    const raw = await qb.getRawMany<CompanyListRawRow>();

    const data = raw.map((row) => {
      const contact = new Contact(
        row.t_id,
        row.t_phone,
        row.a_neighbourhood ?? undefined,
        row.a_state ?? undefined,
        row.a_city ?? undefined,
        row.a_address ?? undefined,
        row.a_cep,
        row.a_complement ?? undefined,
      );
      const company = new Company(
        row.c_id,
        row.u_email,
        row.u_password_hash,
        row.c_name,
        row.c_cnpj,
        row.c_responsible_name,
        contact,
      );
      const status = row.u_deleted_at
        ? CompanyStatus.INATIVO
        : CompanyStatus.ATIVO;
      return { company, status };
    });

    return { data, total };
  }

  async findManyForReportByIds(
    ids: string[],
  ): Promise<CompanyReportProjection[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.createCompanyReportQueryBuilder()
      .andWhere('company.id IN (:...ids)', { ids })
      .getRawMany<CompanyReportRawRow>();
    const rowsById = new Map(rows.map((row) => [row.c_id, row]));

    return ids
      .map((id) => rowsById.get(id))
      .filter((row): row is CompanyReportRawRow => Boolean(row))
      .map((row) => this.mapToReportProjection(row));
  }

  async findManyForReportByFilters(
    filters: CompanyFilterOptions = {},
  ): Promise<CompanyReportProjection[]> {
    const qb = this.createCompanyReportQueryBuilder();

    this.applyCompanyFilters(qb, filters);

    const rows = await qb
      .orderBy('company.name', 'ASC')
      .addOrderBy('company.id', 'ASC')
      .getRawMany<CompanyReportRawRow>();

    return rows.map((row) => this.mapToReportProjection(row));
  }

  async findLocations(): Promise<{ city: string; uf: string }[]> {
    const rawData = await this.ormRepository
      .createQueryBuilder('company')
      .innerJoin('company.address', 'address')
      .select('address.city', 'city')
      .addSelect('address.state', 'uf')
      .where('address.city IS NOT NULL')
      .andWhere('address.state IS NOT NULL')
      .distinct(true)
      .getRawMany();

    return rawData as { city: string; uf: string }[];
  }

  private createCompanyBaseQueryBuilder(): SelectQueryBuilder<CompanyOrmEntity> {
    return this.ormRepository
      .createQueryBuilder('company')
      .withDeleted()
      .innerJoin('users', 'user', 'user.id = company.id')
      .innerJoin(
        'telephone_company',
        'telephone',
        'telephone.company_id = company.id',
      )
      .innerJoin(
        'address_company',
        'address',
        'address.company_id = company.id',
      );
  }

  private createCompanyReportQueryBuilder(): SelectQueryBuilder<CompanyOrmEntity> {
    return this.createCompanyBaseQueryBuilder()
      .select('company.id', 'c_id')
      .addSelect('company.cnpj', 'c_cnpj')
      .addSelect('company.name', 'c_name')
      .addSelect('user.email', 'u_email')
      .addSelect('user.created_at', 'u_created_at')
      .addSelect('user.deleted_at', 'u_deleted_at')
      .addSelect('telephone.phone', 't_phone')
      .addSelect('address.neighbourhood', 'a_neighbourhood')
      .addSelect('address.state', 'a_state')
      .addSelect('address.city', 'a_city');
  }

  private applyCompanyFilters(
    qb: SelectQueryBuilder<CompanyOrmEntity>,
    filters: CompanyFilterOptions,
  ): void {
    if (filters.status === CompanyStatus.INATIVO) {
      qb.andWhere('user.deleted_at IS NOT NULL');
    } else if (filters.status === CompanyStatus.ATIVO) {
      qb.andWhere('user.deleted_at IS NULL');
    }

    const search = filters.search?.trim();
    if (search) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('company.name ILIKE :search', { search: `%${search}%` })
            .orWhere('company.cnpj ILIKE :search', { search: `%${search}%` })
            .orWhere('user.email ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    const state = filters.state?.trim();
    if (state) {
      qb.andWhere('address.state ILIKE :state', { state });
    }

    const city = filters.city?.trim();
    if (city) {
      qb.andWhere('address.city ILIKE :city', { city: `%${city}%` });
    }
  }

  private mapToReportProjection(
    row: CompanyReportRawRow,
  ): CompanyReportProjection {
    return {
      id: row.c_id,
      name: row.c_name,
      cnpj: row.c_cnpj,
      email: row.u_email,
      phone: row.t_phone,
      state: row.a_state ?? undefined,
      city: row.a_city ?? undefined,
      neighbourhood: row.a_neighbourhood ?? undefined,
      status: row.u_deleted_at ? CompanyStatus.INATIVO : CompanyStatus.ATIVO,
      createdAt: this.coerceDate(row.u_created_at),
    };
  }

  private coerceDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }
}
