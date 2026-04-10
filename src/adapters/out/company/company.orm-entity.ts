import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('companies')
export class CompanyOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  cnpj: string;

  @Column()
  email: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  street: string;

  @Column()
  neighborhood: string;

  @Column()
  cep: string;

  @Column()
  number: number;

  @Column()
  responsibleName: string;

  @Column()
  phone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
