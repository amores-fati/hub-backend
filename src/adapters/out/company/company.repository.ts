import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICompanyRepository } from '../../../core/ports/company.repository.interface';
import { Company } from '../../../core/domain/company.entity';
import { CompanyOrmEntity } from './company.orm-entity';

@Injectable()
export class CompanyRepository implements ICompanyRepository {
  constructor(
    @InjectRepository(CompanyOrmEntity)
    private readonly ormRepository: Repository<CompanyOrmEntity>,
  ) {}

  async create(company: Company): Promise<Company> {
    const ormEntity = this.ormRepository.create(company);
    const savedEntity = await this.ormRepository.save(ormEntity);
    return this.mapToDomain(savedEntity);
  }

  async findAll(): Promise<Company[]> {
    const ormEntities = await this.ormRepository.find();
    return ormEntities.map((e) => this.mapToDomain(e));
  }

  private mapToDomain(ormEntity: CompanyOrmEntity): Company {
    return new Company(
        ormEntity.id,  
        ormEntity.name,
        ormEntity.cnpj,
        ormEntity.email,
        ormEntity.city,
        ormEntity.state,
        ormEntity.street,
        ormEntity.neighborhood,
        ormEntity.cep,
        ormEntity.number,
        ormEntity.responsibleName,
        ormEntity.phone,
        ormEntity.createdAt,
        ormEntity.updatedAt
    );
  }
}
