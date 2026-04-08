import { IUserRepository } from '../ports/user.repository.interface';
import { IHashService } from '../ports/hash.service.interface';
import { ITokenService } from '../ports/token.service.interface';
import { InvalidCredentialsException } from '../exceptions/invalid-credentials.exception';

export interface LoginResult {
  accessToken: string;
  role: string;
}

export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashService: IHashService,
    private readonly tokenService: ITokenService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsException();
    }

    const passwordMatch = await this.hashService.compare(
      password,
      user.passwordHash,
    );

    if (!passwordMatch) {
      throw new InvalidCredentialsException();
    }

    const accessToken = this.tokenService.generate({
      sub: user.id,
      role: user.role,
    });

    return { accessToken, role: user.role };
  }
}
