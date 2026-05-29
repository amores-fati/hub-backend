import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';
import { TelephoneCompanyOrmEntity } from './telephone-company.orm-entity';
import { AddressCompanyOrmEntity } from './address-company.orm-entity';

@Entity('companies')
export class CompanyOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 18, unique: true })
  cnpj: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'responsible_name', type: 'varchar', length: 100 })
  responsibleName: string;

  @OneToOne(() => UserOrmEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'id',
    foreignKeyConstraintName: 'fk_companies__id__users',
  })
  user: UserOrmEntity;

  @OneToOne(() => TelephoneCompanyOrmEntity, (telephone) => telephone.company, {
    cascade: true,
    eager: false,
  })
  telephone: TelephoneCompanyOrmEntity;

  @OneToOne(() => AddressCompanyOrmEntity, (address) => address.company, {
    cascade: true,
    eager: false,
  })
  address: AddressCompanyOrmEntity;
}
