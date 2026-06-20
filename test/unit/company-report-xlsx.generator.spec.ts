import ExcelJS from 'exceljs';
import { CompanyReportXlsxGenerator } from '../../src/adapters/out/xlsx/company-report-xlsx.generator';

describe('CompanyReportXlsxGenerator', () => {
  it('should generate a valid XLSX workbook with company rows', async () => {
    const generator = new CompanyReportXlsxGenerator();

    const buffer = await generator.generate({
      rows: [
        {
          name: 'HP',
          cnpj: '92.797.901/0001-74',
          email: 'hp@email.com',
          phone: '(11) 98888-8888',
          state: 'SC',
          city: 'Florianopolis',
          neighbourhood: 'Centro',
          status: 'ATIVO',
          createdAt: '23/04/2026',
        },
      ],
    });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet('Empresas');

    expect(buffer.subarray(0, 2).toString()).toBe('PK');
    expect(worksheet).toBeDefined();
    expect(worksheet!.getRow(1).values).toEqual([
      undefined,
      'Empresa',
      'CNPJ',
      'Email',
      'Telefone',
      'Estado',
      'Cidade',
      'Bairro',
      'Status',
      'Data de Cadastro',
    ]);
    expect(worksheet!.getRow(2).values).toEqual([
      undefined,
      'HP',
      '92.797.901/0001-74',
      'hp@email.com',
      '(11) 98888-8888',
      'SC',
      'Florianopolis',
      'Centro',
      'ATIVO',
      '23/04/2026',
    ]);
    expect(worksheet!.getCell('A1').style.fill).toMatchObject({
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF673AB7' },
    });
    expect(worksheet!.getCell('I1').style.fill).toMatchObject({
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF673AB7' },
    });
    expect(worksheet!.getCell('J1').style.fill).toBeUndefined();
  });
});
