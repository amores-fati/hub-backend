import { UserRole } from './user-role.enum';

export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public passwordHash: string,
    public role: UserRole,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
