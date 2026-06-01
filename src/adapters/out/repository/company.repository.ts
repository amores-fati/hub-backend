import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICompanyRepository } from '../../../core/ports/company.repository.interface';
import { Company } from '../../../core/domain/company.entity';
import { CompanyOrmEntity } from '../orm/company.orm-entity';
import { Contact } from '../../../core/domain/contact.entity';
import { UserOrmEntity } from '../orm/user.orm-entity';
import { TelephoneCompanyOrmEntity } from '../orm/telephone-company.orm-entity';
import { AddressCompanyOrmEntity } from '../orm/address-company.orm-entity';
import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';

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
}
