import { User } from '../domain/user.entity';

export const IUserRepository = Symbol('IUserRepository');

export interface IUserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  countStudents(): Promise<number>;
  countPcd(): Promise<number>;
  countEmployed(): Promise<number>;
  enrollmentsByMonth(): Promise<{ label: string; count: number }[]>;
  statusDistribution(): Promise<{ status: string; total: number }[]>;
  timeline(): Promise<{ date: Date; type: string }[]>;
  findStudents(params: {
    term?: string;
    location?: string;
    any_disability?: boolean;
    profile?: string;
    page: number;
  }): Promise<User[]>;
  studentsRange(params: {
    date_register_begin: string;
    date_register_end: string;
  }): Promise<User[]>;
}
