export const IResumeReportPdfGenerator = Symbol('IResumeReportPdfGenerator');

export interface ResumeReportPdfRow {
  studentName: string;
  cpf: string;
  interestArea: string;
  preference: string;
  status: string;
}

export interface GenerateResumeReportPdfCommand {
  generatedAt: Date;
  generatedBy: string;
  rows: ResumeReportPdfRow[];
}

export interface IResumeReportPdfGenerator {
  generate(command: GenerateResumeReportPdfCommand): Promise<Buffer>;
}
