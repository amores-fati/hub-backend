/* eslint-disable @typescript-eslint/unbound-method */
import { createHash } from 'crypto';
import { AuthService } from '../../src/core/services/auth.service';
import { IUserRepository } from '../../src/core/ports/user.repository.interface';
import { IHashService } from '../../src/core/ports/hash.service.interface';
import { ITokenService } from '../../src/core/ports/token.service.interface';
import { InvalidCredentialsException } from '../../src/core/exceptions/invalid-credentials.exception';
import {
  ChangePasswordCommand,
  ForgotPasswordCommand,
  LoginCommand,
  ResetPasswordCommand,
} from '../../src/core/command/auth.command';
import { UserRoleEnum } from '../../src/core/domain/enums/user-role.enum';
import { IStudentRepository } from '../../src/core/ports/student.repository.interface';
import { ICompanyRepository } from '../../src/core/ports/company.repository.interface';
import { IAdminRepository } from '../../src/core/ports/admin.repository.interface';
import { IPasswordResetTokenRepository } from '../../src/core/ports/password-reset-token.repository.interface';
import { IMailService } from '../../src/core/ports/mail.service.interface';
import { InvalidPasswordResetTokenException } from '../../src/core/exceptions/invalid-password-reset-token.exception';

describe('AuthService', () => {
  let service: AuthService;
  let mockStudentRepository: IStudentRepository;
  let mockCompanyRepository: ICompanyRepository;
  let mockAdminRepository: IAdminRepository;
  let mockPasswordResetTokenRepository: IPasswordResetTokenRepository;
  let mockMailService: IMailService;

  const mockUserRepository: IUserRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockHashService: IHashService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const mockTokenService: ITokenService = {
    generate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockStudentRepository = {
      existsById: jest.fn(),
    } as unknown as IStudentRepository;
    mockCompanyRepository = {
      existsById: jest.fn(),
    } as unknown as ICompanyRepository;
    mockAdminRepository = {
      existsById: jest.fn(),
    } as unknown as IAdminRepository;
    mockPasswordResetTokenRepository = {
      create: jest.fn(),
      findValidByTokenHash: jest.fn(),
      markAsUsed: jest.fn(),
      invalidatePendingByUserId: jest.fn(),
    };
    mockMailService = {
      sendPasswordResetEmail: jest.fn(),
    };

    service = new AuthService(
      mockUserRepository,
      mockHashService,
      mockTokenService,
      mockStudentRepository,
      mockCompanyRepository,
      mockAdminRepository,
      mockPasswordResetTokenRepository,
      mockMailService,
      {
        frontendUrl: 'https://app.test',
        expirationMinutes: 30,
      },
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('login', () => {
    const command: LoginCommand = {
      email: 'test@test.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@test.com',
      password: 'hashedPassword',
    };

    it('should return an access token if credentials are valid', async () => {
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockHashService.compare as jest.Mock).mockResolvedValue(true);
      (mockTokenService.generate as jest.Mock).mockReturnValue('access-token');

      (mockStudentRepository.existsById as jest.Mock).mockResolvedValue(true);
      (mockCompanyRepository.existsById as jest.Mock).mockResolvedValue(false);
      (mockAdminRepository.existsById as jest.Mock).mockResolvedValue(false);

      const result = await service.login(command);

      expect(result.accessToken).toBe('access-token');
      expect(mockTokenService.generate).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: UserRoleEnum.STUDENT,
      });
    });

    it('should throw InvalidCredentialsException if user not found', async () => {
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.login(command)).rejects.toThrow(
        InvalidCredentialsException,
      );
      expect(mockHashService.compare).not.toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsException if password does not match', async () => {
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockHashService.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(command)).rejects.toThrow(
        InvalidCredentialsException,
      );
      expect(mockTokenService.generate).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const command: ChangePasswordCommand = {
      userId: 'user-id',
      currentPassword: 'current-password',
      newPassword: 'new-password-123',
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@test.com',
      password: 'hashedCurrentPassword',
    };

    it('should update the password if the current password matches', async () => {
      (mockUserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (mockHashService.compare as jest.Mock).mockResolvedValue(true);
      (mockHashService.hash as jest.Mock).mockResolvedValue(
        'hashedNewPassword',
      );
      (mockUserRepository.updatePassword as jest.Mock).mockResolvedValue(
        undefined,
      );

      await service.changePassword(command);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(command.userId);
      expect(mockHashService.compare).toHaveBeenCalledWith(
        command.currentPassword,
        mockUser.password,
      );
      expect(mockHashService.hash).toHaveBeenCalledWith(command.newPassword);
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
        mockUser.id,
        'hashedNewPassword',
      );
    });

    it('should throw InvalidCredentialsException if user is not found', async () => {
      (mockUserRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.changePassword(command)).rejects.toThrow(
        InvalidCredentialsException,
      );
      expect(mockHashService.compare).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsException if current password does not match', async () => {
      (mockUserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (mockHashService.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(command)).rejects.toThrow(
        InvalidCredentialsException,
      );
      expect(mockHashService.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    const command: ForgotPasswordCommand = {
      email: 'test@test.com',
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@test.com',
      password: 'hashedPassword',
    };

    it('should return without creating token or sending email if user does not exist', async () => {
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.forgotPassword(command)).resolves.toBeUndefined();

      expect(
        mockPasswordResetTokenRepository.invalidatePendingByUserId,
      ).not.toHaveBeenCalled();
      expect(mockPasswordResetTokenRepository.create).not.toHaveBeenCalled();
      expect(mockMailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should invalidate old tokens, persist only token hash, and send reset link if user exists', async () => {
      const now = new Date('2026-06-15T12:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);
      (mockUserRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (
        mockPasswordResetTokenRepository.invalidatePendingByUserId as jest.Mock
      ).mockResolvedValue(undefined);
      (mockPasswordResetTokenRepository.create as jest.Mock).mockResolvedValue({
        id: 'reset-token-id',
        userId: mockUser.id,
        tokenHash: 'token-hash',
        expiresAt: new Date('2026-06-15T12:30:00.000Z'),
        used: false,
        createdAt: now,
        usedAt: null,
      });
      (mockMailService.sendPasswordResetEmail as jest.Mock).mockResolvedValue(
        undefined,
      );

      await service.forgotPassword(command);

      expect(
        mockPasswordResetTokenRepository.invalidatePendingByUserId,
      ).toHaveBeenCalledWith(mockUser.id, now);
      expect(mockPasswordResetTokenRepository.create).toHaveBeenCalledTimes(1);

      const createInput = (mockPasswordResetTokenRepository.create as jest.Mock)
        .mock.calls[0][0] as {
        userId: string;
        tokenHash: string;
        expiresAt: Date;
      };
      const mailInput = (mockMailService.sendPasswordResetEmail as jest.Mock)
        .mock.calls[0][0] as { to: string; resetLink: string };
      const token = new URL(mailInput.resetLink).searchParams.get('token');

      expect(createInput.userId).toBe(mockUser.id);
      expect(createInput.expiresAt).toEqual(
        new Date('2026-06-15T12:30:00.000Z'),
      );
      expect(token).toBeTruthy();
      expect(createInput.tokenHash).toBe(
        createHash('sha256').update(token!).digest('hex'),
      );
      expect(createInput.tokenHash).not.toBe(token);
      expect(mailInput).toEqual({
        to: mockUser.email,
        resetLink: `https://app.test/reset-password?token=${token}`,
      });
    });
  });

  describe('resetPassword', () => {
    const command: ResetPasswordCommand = {
      token: 'plain-reset-token',
      newPassword: 'new-password-123',
    };

    const tokenHash = createHash('sha256').update(command.token).digest('hex');

    const resetToken = {
      id: 'reset-token-id',
      userId: 'user-id',
      tokenHash,
      expiresAt: new Date('2026-06-15T12:30:00.000Z'),
      used: false,
      createdAt: new Date('2026-06-15T12:00:00.000Z'),
      usedAt: null,
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@test.com',
      password: 'oldHashedPassword',
    };

    it('should update password and mark token as used if reset token is valid', async () => {
      const now = new Date('2026-06-15T12:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);
      (
        mockPasswordResetTokenRepository.findValidByTokenHash as jest.Mock
      ).mockResolvedValue(resetToken);
      (mockUserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (mockHashService.hash as jest.Mock).mockResolvedValue(
        'newHashedPassword',
      );
      (mockUserRepository.updatePassword as jest.Mock).mockResolvedValue(
        undefined,
      );
      (
        mockPasswordResetTokenRepository.markAsUsed as jest.Mock
      ).mockResolvedValue(undefined);

      await service.resetPassword(command);

      expect(
        mockPasswordResetTokenRepository.findValidByTokenHash,
      ).toHaveBeenCalledWith(tokenHash, now);
      expect(mockHashService.hash).toHaveBeenCalledWith(command.newPassword);
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
        mockUser.id,
        'newHashedPassword',
      );
      expect(mockPasswordResetTokenRepository.markAsUsed).toHaveBeenCalledWith(
        resetToken.id,
        now,
      );
    });

    it('should reject invalid, expired, or used token', async () => {
      (
        mockPasswordResetTokenRepository.findValidByTokenHash as jest.Mock
      ).mockResolvedValue(null);

      await expect(service.resetPassword(command)).rejects.toThrow(
        InvalidPasswordResetTokenException,
      );
      expect(mockHashService.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
      expect(
        mockPasswordResetTokenRepository.markAsUsed,
      ).not.toHaveBeenCalled();
    });

    it('should reject token if related user no longer exists', async () => {
      (
        mockPasswordResetTokenRepository.findValidByTokenHash as jest.Mock
      ).mockResolvedValue(resetToken);
      (mockUserRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.resetPassword(command)).rejects.toThrow(
        InvalidPasswordResetTokenException,
      );
      expect(mockHashService.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
      expect(
        mockPasswordResetTokenRepository.markAsUsed,
      ).not.toHaveBeenCalled();
    });
  });
});
