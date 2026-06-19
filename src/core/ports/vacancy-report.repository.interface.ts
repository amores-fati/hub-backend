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

export interface MyVacancyProjection {
  id: string;
  companyId: string;
  name: string;
  description: string;
  openingsCount: number;
  applicationLink: string | null;
  workplaceType: string;
  isPcd: boolean;
  announcementDate: Date;
  skills: { id: string; name: string }[];
}

export interface MyVacanciesFilters {
  companyId: string;
  search?: string;
  vacancyCount?: number;
  isPcd?: boolean;
  workplaceType?: string;
  page: number;
  limit: number;
}

export interface PaginatedVacanciesResult {
  data: MyVacancyProjection[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminVacancyFilters {
  search?: string;
  isPcd?: boolean;
  workType?: string;
  page: number;
  limit: number;
}

export interface AdminVacancyListItem {
  id: string;
  name: string;
  companyName: string;
  openingsCount: number;
  isPcd: boolean;
  announcementDate: Date;
  workplaceType: string;
}

export interface PaginatedAdminVacanciesResult {
  items: AdminVacancyListItem[];
  total: number;
}

export interface IVacancyReportRepository {
  findManyByIds(ids: string[]): Promise<VacancyReportProjection[]>;
  findManyByFilters(
    filters?: VacancyReportFilters,
  ): Promise<VacancyReportProjection[]>;
  findMyVacancies(
    filters: MyVacanciesFilters,
  ): Promise<PaginatedVacanciesResult>;
  findAllForAdmin(
    filters: AdminVacancyFilters,
  ): Promise<PaginatedAdminVacanciesResult>;
  findCompanyIdById(id: string): Promise<string | null>;
  deleteById(id: string): Promise<void>;
}
