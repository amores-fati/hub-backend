export const IVacancyReportPdfGenerator = Symbol('IVacancyReportPdfGenerator');

export interface VacancyReportPdfRow {
  name: string;
  openingsCount: string;
  isPcd: string;
  announcementDate: string;
}

export interface GenerateVacancyReportPdfCommand {
  generatedAt: Date;
  generatedBy: string;
  rows: VacancyReportPdfRow[];
}

export interface IVacancyReportPdfGenerator {
  generate(command: GenerateVacancyReportPdfCommand): Promise<Buffer>;
}
