import * as bcrypt from 'bcrypt';
import { IHashService } from '../../../core/ports/hash.service.interface';

export class BcryptHashService implements IHashService {
  private readonly saltRounds = 10;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
