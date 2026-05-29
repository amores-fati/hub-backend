export const IVacancyReportRepository = Symbol('IVacancyReportRepository');

export interface VacancyReportFilters {
  search?: string;
  isPcd?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface VacancyReportProjection {
  id: string;
  name: string;
  openingsCount: number;
  isPcd: boolean;
  announcementDate: Date;
}

export interface MyVacanciesFilters {
  companyId: string;
  search?: string;
  vacancyCount?: number;
  isPcd?: boolean;
  page: number;
  limit: number;
}

export interface PaginatedVacanciesResult {
  data: VacancyReportProjection[];
  total: number;
  page: number;
  limit: number;
}

export interface IVacancyReportRepository {
  findManyByIds(ids: string[]): Promise<VacancyReportProjection[]>;
  findManyByFilters(
    filters?: VacancyReportFilters,
  ): Promise<VacancyReportProjection[]>;
  findMyVacancies(
    filters: MyVacanciesFilters,
  ): Promise<PaginatedVacanciesResult>;
  findCompanyIdById(id: string): Promise<string | null>;
  deleteById(id: string): Promise<void>;
}
