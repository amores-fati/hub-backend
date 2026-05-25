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

export interface IVacancyReportRepository {
  findManyByIds(ids: string[]): Promise<VacancyReportProjection[]>;
  findManyByFilters(
    filters?: VacancyReportFilters,
  ): Promise<VacancyReportProjection[]>;
}
