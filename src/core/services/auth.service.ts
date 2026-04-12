import { IUserRepository } from '../ports/user.repository.interface';
import { IHashService } from '../ports/hash.service.interface';
import { ITokenService } from '../ports/token.service.interface';
import { InvalidCredentialsException } from '../exceptions/invalid-credentials.exception';
import { LoginCommand } from '../command/auth.command';

export interface LoginResult {
  accessToken: string;
}

export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashService: IHashService,
    private readonly tokenService: ITokenService,
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

    const accessToken = this.tokenService.generate({
      sub: user.id,
      email: user.email,
    });

    return { accessToken };
  }
}