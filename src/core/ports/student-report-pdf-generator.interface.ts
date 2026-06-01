export const IStudentReportPdfGenerator = Symbol('IStudentReportPdfGenerator');

export interface StudentReportPdfRow {
  name: string;
  cpf: string;
  course: string;
  email: string;
  phone: string;
  location: string;
  pcd: string;
}

export interface GenerateStudentReportPdfCommand {
  generatedAt: Date;
  generatedBy: string;
  rows: StudentReportPdfRow[];
}

export interface IStudentReportPdfGenerator {
  generate(command: GenerateStudentReportPdfCommand): Promise<Buffer>;
}
