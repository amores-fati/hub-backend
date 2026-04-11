import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('contact')
export class ContactOrmEntity {
  @PrimaryColumn('varchar')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

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
}
