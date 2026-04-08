import { JwtService } from '@nestjs/jwt';
import { ITokenService } from '../../../core/ports/token.service.interface';

export class JwtTokenService implements ITokenService {
  constructor(private readonly jwtService: JwtService) {}

  generate(payload: Record<string, unknown>): string {
    return this.jwtService.sign(payload);
  }
}
