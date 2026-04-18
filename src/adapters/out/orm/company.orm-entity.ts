import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';
import { ContactOrmEntity } from './contact.orm-entity';

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

  @OneToOne(() => ContactOrmEntity, {
    eager: true,
    onDelete: 'NO ACTION',
    nullable: false,
  })
  @JoinColumn({
    name: 'contact_id',
    foreignKeyConstraintName: 'fk_companies__contact_id__contacts',
  })
  contact: ContactOrmEntity;
}
