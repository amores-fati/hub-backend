export const ICourseReportPdfGenerator = Symbol('ICourseReportPdfGenerator');

export interface CourseReportPdfRow {
  name: string;
  modality: string;
  address: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface GenerateCourseReportPdfCommand {
  generatedAt: Date;
  generatedBy: string;
  rows: CourseReportPdfRow[];
}

export interface ICourseReportPdfGenerator {
  generate(command: GenerateCourseReportPdfCommand): Promise<Buffer>;
}
