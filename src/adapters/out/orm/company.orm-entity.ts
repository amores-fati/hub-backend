import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';
import { ContactOrmEntity } from './contact.orm-entity';

@Entity('companies')
export class CompanyOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 18 })
  cnpj: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  ownerName: string;

  @OneToOne(() => UserOrmEntity, { cascade: true, eager: true })
  @JoinColumn({ name: 'id' })
  user: UserOrmEntity;

  @OneToOne(() => ContactOrmEntity, { cascade: true, eager: true })
  @JoinColumn({ name: 'contact_id' })
  contact: ContactOrmEntity;
}
