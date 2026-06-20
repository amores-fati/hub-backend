export const ICompanyReportXlsxGenerator = Symbol(
  'ICompanyReportXlsxGenerator',
);

export interface CompanyReportXlsxRow {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  neighbourhood: string;
  status: string;
  createdAt: string;
}

export interface GenerateCompanyReportXlsxCommand {
  rows: CompanyReportXlsxRow[];
}

export interface ICompanyReportXlsxGenerator {
  generate(command: GenerateCompanyReportXlsxCommand): Promise<Buffer>;
}
