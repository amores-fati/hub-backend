import { Entity, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

@Entity('admins')
export class AdminOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'id',
    foreignKeyConstraintName: 'fk_admins__id__users',
  })
  user: UserOrmEntity;
}
