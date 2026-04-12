import { Entity, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

@Entity('admins')
export class AdminOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => UserOrmEntity, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  user: UserOrmEntity;
}
