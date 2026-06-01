import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { CompanyOrmEntity } from './company.orm-entity';

@Entity('telephone_company')
export class TelephoneCompanyOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @OneToOne(() => CompanyOrmEntity, (company) => company.telephone, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'company_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'fk_telephone_company__company_id__companies',
  })
  company: CompanyOrmEntity;
}
