import { Student } from '../domain/student.entity';

export const IStudentRepository = Symbol('IStudentRepository');

export interface StudentEnrollmentListProjection {
  courseId: string;
  courseModality: string;
}

export interface StudentListProjection {
  id: string;
  email: string;
  cpf: string;
  fullName: string;
  socialName?: string;
  phoneNumber: string;
  city?: string;
  state?: string;
  hasDisability?: boolean;
  disabilityType?: string;
  enrollments: StudentEnrollmentListProjection[];
}

export interface PaginatedStudentListResult {
  items: StudentListProjection[];
  total: number;
}

export interface StudentFilterQuery {
  search?: string;
  city?: string[];
  disabilityType?: string[];
  modality?: string;
  page: number;
  pageSize: 20 | 50;
}
export interface IStudentRepository {
  create(student: Student): Promise<Student>;
  findAll(): Promise<Student[]>;
  findAllWithFilter(
    query: StudentFilterQuery,
  ): Promise<PaginatedStudentListResult>;
  findById(id: string): Promise<Student | null>;
  existsById(id: string): Promise<boolean>;
  findByCpf(cpf: string, includeDeleted?: boolean): Promise<Student | null>;
  update(student: Student): Promise<Student>;
  delete(id: string): Promise<void>;
  softDeleteMany(ids: string[]): Promise<void>;
  findLocations(): Promise<{ city: string; uf: string }[]>;
}
