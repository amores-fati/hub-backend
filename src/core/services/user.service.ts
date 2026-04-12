import { User } from '../domain/user.entity';
import { IUserRepository } from '../ports/user.repository.interface';
import { UserAlreadyExistsException } from '../exceptions/user-already-exists.exception';
import { randomUUID } from 'crypto';

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUser(email: string, password: string): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new UserAlreadyExistsException(email);
    }

    const user = new User(randomUUID(), email, password);
    return this.userRepository.create(user);
  }
}
