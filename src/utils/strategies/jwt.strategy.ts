import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '../../core/ports/user.repository.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject(IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'default-secret-key-for-dev'),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.userRepository.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }
    
    return { id: payload.sub, email: payload.email };
  }
}