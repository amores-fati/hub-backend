import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

@Entity('password_reset_tokens')
export class PasswordResetTokenOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  used: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  createdAt: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;
}
