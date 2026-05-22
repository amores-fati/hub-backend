export const IResumeReportRepository = Symbol('IResumeReportRepository');

export type ResumeReportStatus = 'ATIVO' | 'INATIVO';

export interface ResumeReportFilters {
  search?: string;
  interestArea?: string;
  preference?: string;
  status?: ResumeReportStatus;
}

export interface ResumeReportProjection {
  id: string;
  studentName: string;
  socialName?: string;
  cpf: string;
  interestArea?: string;
  preference?: string;
  isAvailable: boolean;
}

export interface IResumeReportRepository {
  findManyByIds(ids: string[]): Promise<ResumeReportProjection[]>;
  findManyByFilters(
    filters?: ResumeReportFilters,
  ): Promise<ResumeReportProjection[]>;
}
