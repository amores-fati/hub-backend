export const IStudentReportXlsxGenerator = Symbol(
  'IStudentReportXlsxGenerator',
);

export interface StudentReportXlsxRow {
  name: string;
  cpf: string;
  course: string;
  email: string;
  phone: string;
  location: string;
  pcd: string;
}

export interface GenerateStudentReportXlsxCommand {
  rows: StudentReportXlsxRow[];
}

export interface IStudentReportXlsxGenerator {
  generate(command: GenerateStudentReportXlsxCommand): Promise<Buffer>;
}
