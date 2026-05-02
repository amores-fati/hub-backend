import { Student } from '../domain/student.entity';

export const IStudentRepository = Symbol('IStudentRepository');

export interface StudentFilterQuery {
  cpf: string;
  text: string;
  textFilter?: string;
  courseType?: string;
  location?: string;
  disability?: string;
}
export interface IStudentRepository {
  create(student: Student): Promise<Student>;
  findAll(): Promise<Student[]>;
  findAllWithFilter(query: StudentFilterQuery): Promise<Student[]>;
  findById(id: string): Promise<Student | null>;
  existsById(id: string): Promise<boolean>;
  findByCpf(cpf: string): Promise<Student | null>;
  update(student: Student): Promise<Student>;
  delete(id: string): Promise<void>;
}
