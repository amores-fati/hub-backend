import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserOrmEntity } from '../user/user.orm-entity';

@Entity('contacts') 
export class ContactOrmEntity {
  
  @PrimaryColumn('uuid')
  id: string; // 

  @OneToOne(() => UserOrmEntity, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' }) 
  user: UserOrmEntity;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  cep: string;

  @Column({ nullable: true })
  complement: string;
  
}