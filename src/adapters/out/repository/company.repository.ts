import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICompanyRepository } from '../../../core/ports/company.repository.interface';
import { Company } from '../../../core/domain/company.entity';
import { CompanyOrmEntity } from '../orm/company.orm-entity';
import { Contact } from '../../../core/domain/contact.entity';
import { UserOrmEntity } from '../orm/user.orm-entity';
import { ContactOrmEntity } from '../orm/contact.orm-entity';

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
        await transactionalEntityManager.save(ormEntity.contact);
        await transactionalEntityManager.save(ormEntity);
      },
    );

    return this.mapToDomain(ormEntity);
  }

  async findAll(): Promise<Company[]> {
    const ormEntities = await this.ormRepository.find({
      relations: ['user', 'contact'],
    });
    return ormEntities.map((e) => this.mapToDomain(e));
  }

  async findById(id: string): Promise<Company | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id },
      relations: ['user', 'contact'],
    });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async findByCnpj(cnpj: string): Promise<Company | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { cnpj },
      relations: ['user', 'contact'],
    });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async update(company: Company): Promise<Company> {
    const ormEntity = this.mapToOrm(company);

    await this.ormRepository.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.save(ormEntity.user);
        await transactionalEntityManager.save(ormEntity.contact);
        await transactionalEntityManager.save(ormEntity);
      },
    );

    return this.mapToDomain(ormEntity);
  }

  async delete(id: string): Promise<void> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id },
      relations: ['user', 'contact'],
    });

    if (ormEntity) {
      await this.ormRepository.manager.transaction(
        async (transactionalEntityManager) => {
          await transactionalEntityManager.remove(ormEntity);

          if (ormEntity.contact) {
            await transactionalEntityManager.remove(ormEntity.contact);
          }

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
    ormEntity.ownerName = company.ownerName;

    ormEntity.user = new UserOrmEntity();
    ormEntity.user.id = company.id;
    ormEntity.user.email = company.email;
    ormEntity.user.password = company.password;

    ormEntity.contact = new ContactOrmEntity();
    ormEntity.contact.id = company.contact.id;
    ormEntity.contact.phone = company.contact.phone;
    ormEntity.contact.neighbourhood = company.contact.neighbourhood || null;
    ormEntity.contact.state = company.contact.state || null;
    ormEntity.contact.city = company.contact.city || null;
    ormEntity.contact.address = company.contact.address || null;
    ormEntity.contact.cep = company.contact.cep || null;
    ormEntity.contact.complement = company.contact.complement || null;

    return ormEntity;
  }

  private mapToDomain(ormEntity: CompanyOrmEntity): Company {
    const contact = new Contact(
      ormEntity.contact.id,
      ormEntity.contact.phone,
      ormEntity.contact.neighbourhood || undefined,
      ormEntity.contact.state || undefined,
      ormEntity.contact.city || undefined,
      ormEntity.contact.address || undefined,
      ormEntity.contact.cep || undefined,
      ormEntity.contact.complement || undefined,
    );

    return new Company(
      ormEntity.id,
      ormEntity.user.email,
      ormEntity.user.password,
      ormEntity.name,
      ormEntity.cnpj,
      ormEntity.ownerName,
      contact,
    );
  }
}
