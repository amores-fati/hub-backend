export const IPasswordResetTokenRepository = Symbol(
  'IPasswordResetTokenRepository',
);

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  usedAt: Date | null;
}

export interface IPasswordResetTokenRepository {
  create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken>;

  findValidByTokenHash(
    tokenHash: string,
    now: Date,
  ): Promise<PasswordResetToken | null>;

  markAsUsed(id: string, usedAt: Date): Promise<void>;

  invalidatePendingByUserId(userId: string, usedAt: Date): Promise<void>;
}
