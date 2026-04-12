import { User } from '../domain/user.entity';

export const IAdminRepository = Symbol('IAdminRepository');

export interface IAdminRepository {
  create(admin: User): Promise<User>;
}