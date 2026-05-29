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

export type StudentReportStatus = 'INSCRICAO' | 'INTERESSE' | 'NAO_INSCRITO';

export interface StudentReportFilters {
  search?: string;
  course?: string;
  location?: string;
  pcdType?: string;
  status?: StudentReportStatus;
}

export interface StudentReportProjection {
  id: string;
  email: string;
  cpf: string;
  fullName: string;
  socialName?: string;
  phoneNumber: string;
  city?: string;
  state?: string;
  courseNames: string[];
  hasDisability?: boolean;
  disabilityType?: string;
}

export interface StudentFilterQuery {
  search?: string;
  city?: string[];
  disabilityType?: string[];
  modality?: string;
  page: number;
  pageSize: 20 | 50;
}
export interface DisabilityCount {
  disabilityType: string;
  count: number;
}
export interface StudentCityCount {
  cityName: string;
  uf: string;
  studentsCount: number;
}
export interface IStudentRepository {
  create(student: Student): Promise<Student>;
  findAll(): Promise<Student[]>;
  findAllWithFilter(
    query: StudentFilterQuery,
  ): Promise<PaginatedStudentListResult>;
  findManyForReportByIds(ids: string[]): Promise<StudentReportProjection[]>;
  findManyForReportByFilters(
    filters?: StudentReportFilters,
  ): Promise<StudentReportProjection[]>;
  findById(id: string): Promise<Student | null>;
  existsById(id: string): Promise<boolean>;
  findByCpf(cpf: string, includeDeleted?: boolean): Promise<Student | null>;
  update(student: Student): Promise<Student>;
  delete(id: string): Promise<void>;
  softDeleteMany(ids: string[]): Promise<void>;
  findLocations(): Promise<{ city: string; uf: string }[]>;
  countByDisabilityType(): Promise<DisabilityCount[]>;
  countByCity(): Promise<StudentCityCount[]>;
  countTotal(): Promise<number>;
  countPCD(): Promise<number>;
}
