import { createHash, randomBytes } from 'crypto';
import { IUserRepository } from '../ports/user.repository.interface';
import { IHashService } from '../ports/hash.service.interface';
import { ITokenService } from '../ports/token.service.interface';
import { IStudentRepository } from '../ports/student.repository.interface';
import { ICompanyRepository } from '../ports/company.repository.interface';
import { IAdminRepository } from '../ports/admin.repository.interface';
import { InvalidCredentialsException } from '../exceptions/invalid-credentials.exception';
import {
  ChangePasswordCommand,
  ForgotPasswordCommand,
  LoginCommand,
  ResetPasswordCommand,
} from '../command/auth.command';
import { UserRoleEnum } from '../domain/enums/user-role.enum';
import { InvalidPasswordResetTokenException } from '../exceptions/invalid-password-reset-token.exception';
import { IPasswordResetTokenRepository } from '../ports/password-reset-token.repository.interface';
import { IMailService } from '../ports/mail.service.interface';

export interface LoginResult {
  accessToken: string;
}

export interface PasswordResetOptions {
  frontendUrl: string;
  expirationMinutes: number;
}

export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashService: IHashService,
    private readonly tokenService: ITokenService,
    private readonly studentRepository: IStudentRepository,
    private readonly companyRepository: ICompanyRepository,
    private readonly adminRepository: IAdminRepository,
    private readonly passwordResetTokenRepository?: IPasswordResetTokenRepository,
    private readonly mailService?: IMailService,
    private readonly passwordResetOptions: PasswordResetOptions = {
      frontendUrl: 'http://localhost:3000',
      expirationMinutes: 30,
    },
  ) {}

  async login(command: LoginCommand): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(command.email);

    if (!user) {
      throw new InvalidCredentialsException();
    }

    const passwordMatch = await this.hashService.compare(
      command.password,
      user.password,
    );

    if (!passwordMatch) {
      throw new InvalidCredentialsException();
    }

    const [isStudent, isCompany, isAdmin] = await Promise.all([
      this.studentRepository.existsById(user.id),
      this.companyRepository.existsById(user.id),
      this.adminRepository.existsById(user.id),
    ]);

    let role: UserRoleEnum;
    if (isStudent) role = UserRoleEnum.STUDENT;
    else if (isCompany) role = UserRoleEnum.COMPANY;
    else if (isAdmin) role = UserRoleEnum.ADMIN;
    else throw new InvalidCredentialsException();

    const tokenPayload: Record<string, unknown> = {
      sub: user.id,
      email: user.email,
      role: role,
    };

    if (role === UserRoleEnum.COMPANY) {
      tokenPayload.companyId = user.id;
    }

    const accessToken = this.tokenService.generate(tokenPayload);

    return { accessToken };
  }

  async changePassword(command: ChangePasswordCommand): Promise<void> {
    const user = await this.userRepository.findById(command.userId);

    if (!user) {
      throw new InvalidCredentialsException();
    }

    const passwordMatch = await this.hashService.compare(
      command.currentPassword,
      user.password,
    );

    if (!passwordMatch) {
      throw new InvalidCredentialsException();
    }

    const hashedPassword = await this.hashService.hash(command.newPassword);

    await this.userRepository.updatePassword(user.id, hashedPassword);
  }

  async forgotPassword(command: ForgotPasswordCommand): Promise<void> {
    const { passwordResetTokenRepository, mailService } =
      this.getPasswordResetDependencies();
    const user = await this.userRepository.findByEmail(command.email);

    if (!user) {
      return;
    }

    const now = new Date();
    const token = this.createPasswordResetToken();
    const tokenHash = this.hashPasswordResetToken(token);
    const expiresAt = new Date(
      now.getTime() + this.passwordResetOptions.expirationMinutes * 60 * 1000,
    );

    await passwordResetTokenRepository.invalidatePendingByUserId(user.id, now);
    await passwordResetTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await mailService.sendPasswordResetEmail({
      to: user.email,
      resetLink: this.buildPasswordResetLink(token),
    });
  }

  async resetPassword(command: ResetPasswordCommand): Promise<void> {
    const { passwordResetTokenRepository } =
      this.getPasswordResetDependencies();
    const now = new Date();
    const tokenHash = this.hashPasswordResetToken(command.token);
    const resetToken = await passwordResetTokenRepository.findValidByTokenHash(
      tokenHash,
      now,
    );

    if (!resetToken) {
      throw new InvalidPasswordResetTokenException();
    }

    const user = await this.userRepository.findById(resetToken.userId);

    if (!user) {
      throw new InvalidPasswordResetTokenException();
    }

    const hashedPassword = await this.hashService.hash(command.newPassword);

    await this.userRepository.updatePassword(user.id, hashedPassword);
    await passwordResetTokenRepository.markAsUsed(resetToken.id, now);
  }

  private createPasswordResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashPasswordResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildPasswordResetLink(token: string): string {
    const frontendUrl = this.passwordResetOptions.frontendUrl.replace(
      /\/+$/,
      '',
    );

    return `${frontendUrl}/reset-password?token=${token}`;
  }

  private getPasswordResetDependencies(): {
    passwordResetTokenRepository: IPasswordResetTokenRepository;
    mailService: IMailService;
  } {
    if (!this.passwordResetTokenRepository || !this.mailService) {
      throw new Error(
        'Password reset dependencies are not configured for AuthService.',
      );
    }

    return {
      passwordResetTokenRepository: this.passwordResetTokenRepository,
      mailService: this.mailService,
    };
  }
}
