import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  GenerateCourseReportPdfCommand,
  ICourseReportPdfGenerator,
} from '../../../core/ports/course-report-pdf-generator.interface';

interface TableColumn {
  label: string;
  key: keyof GenerateCourseReportPdfCommand['rows'][number];
  width: number;
}

@Injectable()
export class CourseReportPdfGenerator implements ICourseReportPdfGenerator {
  private readonly margin = 40;
  private readonly cellPadding = 5;
  private readonly rowMinHeight = 24;
  private readonly footerHeight = 42;
  private readonly firstPageTableTop = 124;
  private readonly continuationTableTop = 48;
  private readonly columns: TableColumn[] = [
    { label: 'Nome', key: 'name', width: 120 },
    { label: 'Modalidade', key: 'modality', width: 72 },
    { label: 'Endere\u00e7o', key: 'address', width: 126 },
    { label: 'Status', key: 'status', width: 62 },
    { label: 'Data Inicial', key: 'startDate', width: 68 },
    { label: 'Data Final', key: 'endDate', width: 68 },
  ];

  async generate(command: GenerateCourseReportPdfCommand): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        bufferPages: true,
        compress: false,
        margin: this.margin,
        size: 'A4',
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.renderHeader(doc, command.generatedAt);
      this.renderTable(doc, command.rows);
      this.renderFooters(doc, command.generatedBy);

      doc.end();
    });
  }

  private renderHeader(doc: PDFKit.PDFDocument, generatedAt: Date): void {
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#111827')
      .text('Amores Fati', this.margin, 38);

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('Relat\u00f3rio de Cursos', this.margin, 66);

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#4b5563')
      .text(`Gerado em: ${this.formatDateTime(generatedAt)}`, this.margin, 94);
  }

  private renderTable(
    doc: PDFKit.PDFDocument,
    rows: GenerateCourseReportPdfCommand['rows'],
  ): void {
    let y = this.firstPageTableTop;

    this.renderTableHeader(doc, y);
    y += this.rowMinHeight;

    if (rows.length === 0) {
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#374151')
        .text('Nenhum curso encontrado.', this.margin, y + 8);
      return;
    }

    for (const row of rows) {
      const rowHeight = this.calculateRowHeight(doc, row);

      if (y + rowHeight > this.contentBottom(doc)) {
        doc.addPage();
        y = this.continuationTableTop;
        this.renderTableHeader(doc, y);
        y += this.rowMinHeight;
      }

      this.renderRow(doc, row, y, rowHeight);
      y += rowHeight;
    }
  }

  private renderTableHeader(doc: PDFKit.PDFDocument, y: number): void {
    let x = this.margin;

    doc.font('Helvetica-Bold').fontSize(8).fillColor('#111827');

    for (const column of this.columns) {
      doc
        .rect(x, y, column.width, this.rowMinHeight)
        .fillAndStroke('#f3f4f6', '#d1d5db');
      doc.fillColor('#111827').text(column.label, x + this.cellPadding, y + 8, {
        width: column.width - this.cellPadding * 2,
      });
      x += column.width;
    }
  }

  private renderRow(
    doc: PDFKit.PDFDocument,
    row: GenerateCourseReportPdfCommand['rows'][number],
    y: number,
    height: number,
  ): void {
    let x = this.margin;

    doc.font('Helvetica').fontSize(8).fillColor('#1f2937');

    for (const column of this.columns) {
      const value = row[column.key];
      doc.rect(x, y, column.width, height).stroke('#e5e7eb');
      doc.fillColor('#1f2937').text(value, x + this.cellPadding, y + 7, {
        width: column.width - this.cellPadding * 2,
        height: height - this.cellPadding * 2,
      });
      x += column.width;
    }
  }

  private calculateRowHeight(
    doc: PDFKit.PDFDocument,
    row: GenerateCourseReportPdfCommand['rows'][number],
  ): number {
    doc.font('Helvetica').fontSize(8);

    const contentHeight = Math.max(
      ...this.columns.map((column) =>
        doc.heightOfString(row[column.key], {
          width: column.width - this.cellPadding * 2,
        }),
      ),
    );

    return Math.max(this.rowMinHeight, contentHeight + this.cellPadding * 2);
  }

  private renderFooters(doc: PDFKit.PDFDocument, generatedBy: string): void {
    const range = doc.bufferedPageRange();

    for (let index = range.start; index < range.start + range.count; index++) {
      doc.switchToPage(index);

      const pageNumber = index - range.start + 1;
      const footerY = doc.page.height - this.margin - 28;

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#6b7280')
        .text(
          `P\u00e1gina ${pageNumber} de ${range.count}`,
          this.margin,
          footerY,
          {
            width: doc.page.width - this.margin * 2,
            align: 'center',
          },
        )
        .text(`Gerado por: ${generatedBy}`, this.margin, footerY + 12, {
          width: doc.page.width - this.margin * 2,
          align: 'center',
        });
    }
  }

  private contentBottom(doc: PDFKit.PDFDocument): number {
    return doc.page.height - this.margin - this.footerHeight;
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  }
}
