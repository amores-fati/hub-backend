import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import {
  IPasswordResetTokenRepository,
  PasswordResetToken,
} from '../../../core/ports/password-reset-token.repository.interface';
import { PasswordResetTokenOrmEntity } from '../orm/password-reset-token.orm-entity';

@Injectable()
export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(
    @InjectRepository(PasswordResetTokenOrmEntity)
    private readonly ormRepository: Repository<PasswordResetTokenOrmEntity>,
  ) {}

  async create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    const ormEntity = this.ormRepository.create({
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    });

    const saved = await this.ormRepository.save(ormEntity);
    return this.mapToDomain(saved);
  }

  async findValidByTokenHash(
    tokenHash: string,
    now: Date,
  ): Promise<PasswordResetToken | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: {
        tokenHash,
        used: false,
        expiresAt: MoreThan(now),
      },
    });

    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async markAsUsed(id: string, usedAt: Date): Promise<void> {
    await this.ormRepository.update(id, {
      used: true,
      usedAt,
    });
  }

  async invalidatePendingByUserId(userId: string, usedAt: Date): Promise<void> {
    await this.ormRepository.update(
      {
        userId,
        used: false,
      },
      {
        used: true,
        usedAt,
      },
    );
  }

  private mapToDomain(
    ormEntity: PasswordResetTokenOrmEntity,
  ): PasswordResetToken {
    return {
      id: ormEntity.id,
      userId: ormEntity.userId,
      tokenHash: ormEntity.tokenHash,
      expiresAt: ormEntity.expiresAt,
      used: ormEntity.used,
      createdAt: ormEntity.createdAt,
      usedAt: ormEntity.usedAt,
    };
  }
}
