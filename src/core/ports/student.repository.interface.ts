import { Student } from '../domain/student.entity';

export const IStudentRepository = Symbol('IStudentRepository');

export interface IStudentRepository {
  create(student: Student): Promise<Student>;
  findAll(): Promise<Student[]>;
  findById(id: string): Promise<Student | null>;
  findByCpf(cpf: string): Promise<Student | null>;
  update(student: Student): Promise<Student>;
  delete(id: string): Promise<void>;
}