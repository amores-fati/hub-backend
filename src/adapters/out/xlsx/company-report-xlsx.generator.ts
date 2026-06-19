import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import {
  GenerateCompanyReportXlsxCommand,
  ICompanyReportXlsxGenerator,
} from '../../../core/ports/company-report-xlsx-generator.interface';

@Injectable()
export class CompanyReportXlsxGenerator
  implements ICompanyReportXlsxGenerator
{
  async generate(command: GenerateCompanyReportXlsxCommand): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Amores Fati';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Empresas');

    worksheet.columns = [
      { header: 'Empresa', key: 'name', width: 24 },
      { header: 'CNPJ', key: 'cnpj', width: 20 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Telefone', key: 'phone', width: 18 },
      { header: 'Estado', key: 'state', width: 10 },
      { header: 'Cidade', key: 'city', width: 20 },
      { header: 'Bairro', key: 'neighbourhood', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Data de Cadastro', key: 'createdAt', width: 18 },
    ];

    worksheet.addRows(command.rows);
    this.styleHeader(worksheet);
    this.autoFitColumns(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  }

  private styleHeader(worksheet: ExcelJS.Worksheet): void {
    const header = worksheet.getRow(1);

    header.height = 20;

    for (
      let columnIndex = 1;
      columnIndex <= worksheet.columns.length;
      columnIndex += 1
    ) {
      const cell = header.getCell(columnIndex);

      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF673AB7' },
      };
      cell.alignment = { vertical: 'middle' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      };
    }
  }

  private autoFitColumns(worksheet: ExcelJS.Worksheet): void {
    worksheet.columns.forEach((column) => {
      const headerLength = String(column.header ?? '').length;
      let maxLength = headerLength;

      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const value = cell.value;
        const text =
          value === null || value === undefined ? '' : String(value);
        maxLength = Math.max(maxLength, text.length);
      });

      column.width = Math.min(Math.max(maxLength + 2, 10), 42);
    });
  }
}
