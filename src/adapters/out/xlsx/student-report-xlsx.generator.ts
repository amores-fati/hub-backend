import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import {
  GenerateStudentReportXlsxCommand,
  IStudentReportXlsxGenerator,
} from '../../../core/ports/student-report-xlsx-generator.interface';
import { neutralizeFormulaRows } from './xlsx-security';

@Injectable()
export class StudentReportXlsxGenerator implements IStudentReportXlsxGenerator {
  async generate(command: GenerateStudentReportXlsxCommand): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Amores Fati';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Alunos');

    worksheet.columns = [
      { header: 'Nome', key: 'name', width: 30 },
      { header: 'CPF', key: 'cpf', width: 18 },
      { header: 'Curso(s)', key: 'course', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefone', key: 'phone', width: 18 },
      { header: 'Localidade', key: 'location', width: 20 },
      { header: 'PCD', key: 'pcd', width: 16 },
    ];

    worksheet.addRows(neutralizeFormulaRows(command.rows));
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
        maxLength = Math.max(maxLength, cell.text.length);
      });

      column.width = Math.min(Math.max(maxLength + 2, 10), 42);
    });
  }
}
