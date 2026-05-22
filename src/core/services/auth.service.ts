import { IUserRepository } from '../ports/user.repository.interface';
import { IHashService } from '../ports/hash.service.interface';
import { ITokenService } from '../ports/token.service.interface';
import { IStudentRepository } from '../ports/student.repository.interface';
import { ICompanyRepository } from '../ports/company.repository.interface';
import { IAdminRepository } from '../ports/admin.repository.interface';
import { InvalidCredentialsException } from '../exceptions/invalid-credentials.exception';
import { LoginCommand } from '../command/auth.command';
import { UserRoleEnum } from '../domain/enums/user-role.enum';

export interface LoginResult {
  accessToken: string;
}

export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashService: IHashService,
    private readonly tokenService: ITokenService,
    private readonly studentRepository: IStudentRepository,
    private readonly companyRepository: ICompanyRepository,
    private readonly adminRepository: IAdminRepository,
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
    console.log({ userId: user.id, isStudent, isCompany, isAdmin });

    let role: UserRoleEnum;
    if (isStudent) role = UserRoleEnum.STUDENT;
    else if (isCompany) role = UserRoleEnum.COMPANY;
    else if (isAdmin) role = UserRoleEnum.ADMIN;
    else throw new InvalidCredentialsException();

    const accessToken = this.tokenService.generate({
      sub: user.id,
      email: user.email,
      role: role,
    });

    return { accessToken };
  }
}
