import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { CompanyOrmEntity } from './company.orm-entity';

@Entity('address_company')
export class AddressCompanyOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ type: 'varchar', nullable: true })
  neighbourhood: string | null;

  @Column({ type: 'char', length: 2, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 9, nullable: true })
  cep: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  complement: string | null;

  @OneToOne(() => CompanyOrmEntity, (company) => company.address, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'company_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_address_company__company_id__companies',
  })
  company: CompanyOrmEntity;
}
