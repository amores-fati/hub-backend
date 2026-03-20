import { User } from '../domain/user.entity';

export const IUserRepository = Symbol('IUserRepository');

export interface IUserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}
