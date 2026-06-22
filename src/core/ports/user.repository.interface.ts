import { User } from '../domain/user.entity';

export const IUserRepository = Symbol('IUserRepository');

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string, includeDeleted?: boolean): Promise<User | null>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}
