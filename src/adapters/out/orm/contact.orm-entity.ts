import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

@Entity('contacts')
export class ContactOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  user: UserOrmEntity;

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
