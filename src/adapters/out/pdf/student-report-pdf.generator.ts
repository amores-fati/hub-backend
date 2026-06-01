import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  GenerateStudentReportPdfCommand,
  IStudentReportPdfGenerator,
  StudentReportPdfRow,
} from '../../../core/ports/student-report-pdf-generator.interface';

interface TableColumn {
  label: string;
  key: 'course' | 'location' | 'pcd';
  width: number;
}

@Injectable()
export class StudentReportPdfGenerator implements IStudentReportPdfGenerator {
  private readonly margin = 40;
  private readonly cellPadding = 5;
  private readonly rowMinHeight = 34;
  private readonly footerHeight = 42;
  private readonly firstPageTableTop = 124;
  private readonly continuationTableTop = 48;
  private readonly nameColumnWidth = 125;
  private readonly contactColumnWidth = 120;
  private readonly columns: TableColumn[] = [
    { label: 'Curso', key: 'course', width: 110 },
    { label: 'Localizacao', key: 'location', width: 90 },
    { label: 'PCD', key: 'pcd', width: 70 },
  ];

  async generate(command: GenerateStudentReportPdfCommand): Promise<Buffer> {
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
      .text('Relatorio de Alunos', this.margin, 66);

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#4b5563')
      .text(`Gerado em: ${this.formatDateTime(generatedAt)}`, this.margin, 94);
  }

  private renderTable(
    doc: PDFKit.PDFDocument,
    rows: StudentReportPdfRow[],
  ): void {
    let y = this.firstPageTableTop;

    this.renderTableHeader(doc, y);
    y += this.rowMinHeight;

    if (rows.length === 0) {
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#374151')
        .text('Nenhum aluno encontrado.', this.margin, y + 8);
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

    for (const column of this.allColumns()) {
      doc
        .rect(x, y, column.width, this.rowMinHeight)
        .fillAndStroke('#f3f4f6', '#d1d5db');
      doc
        .fillColor('#111827')
        .text(column.label, x + this.cellPadding, y + 12, {
          width: column.width - this.cellPadding * 2,
        });
      x += column.width;
    }
  }

  private renderRow(
    doc: PDFKit.PDFDocument,
    row: StudentReportPdfRow,
    y: number,
    height: number,
  ): void {
    let x = this.margin;

    this.renderNameCell(doc, row, x, y, height);
    x += this.nameColumnWidth;

    this.renderTextCell(doc, row.course, x, y, height, 8);
    x += this.columns[0].width;

    this.renderContactCell(doc, row, x, y, height);
    x += this.contactColumnWidth;

    this.renderTextCell(doc, row.location, x, y, height, 8);
    x += this.columns[1].width;

    this.renderTextCell(doc, row.pcd, x, y, height, 8);
  }

  private renderNameCell(
    doc: PDFKit.PDFDocument,
    row: StudentReportPdfRow,
    x: number,
    y: number,
    height: number,
  ): void {
    doc.rect(x, y, this.nameColumnWidth, height).stroke('#e5e7eb');

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#111827')
      .text(row.name, x + this.cellPadding, y + 6, {
        width: this.nameColumnWidth - this.cellPadding * 2,
      });

    const nameHeight = doc.heightOfString(row.name, {
      width: this.nameColumnWidth - this.cellPadding * 2,
    });

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#6b7280')
      .text(`CPF: ${row.cpf}`, x + this.cellPadding, y + 8 + nameHeight, {
        width: this.nameColumnWidth - this.cellPadding * 2,
      });
  }

  private renderContactCell(
    doc: PDFKit.PDFDocument,
    row: StudentReportPdfRow,
    x: number,
    y: number,
    height: number,
  ): void {
    doc.rect(x, y, this.contactColumnWidth, height).stroke('#e5e7eb');

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#1f2937')
      .text(row.email, x + this.cellPadding, y + 6, {
        width: this.contactColumnWidth - this.cellPadding * 2,
      });

    const emailHeight = doc.heightOfString(row.email, {
      width: this.contactColumnWidth - this.cellPadding * 2,
    });

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#4b5563')
      .text(row.phone, x + this.cellPadding, y + 8 + emailHeight, {
        width: this.contactColumnWidth - this.cellPadding * 2,
      });
  }

  private renderTextCell(
    doc: PDFKit.PDFDocument,
    value: string,
    x: number,
    y: number,
    height: number,
    fontSize: number,
  ): void {
    const width = this.cellWidthAtX(x);

    doc.rect(x, y, width, height).stroke('#e5e7eb');
    doc
      .font('Helvetica')
      .fontSize(fontSize)
      .fillColor('#1f2937')
      .text(value, x + this.cellPadding, y + 7, {
        width: width - this.cellPadding * 2,
        height: height - this.cellPadding * 2,
      });
  }

  private calculateRowHeight(
    doc: PDFKit.PDFDocument,
    row: StudentReportPdfRow,
  ): number {
    const textWidth = (width: number) => width - this.cellPadding * 2;

    doc.font('Helvetica-Bold').fontSize(8);
    const nameHeight = doc.heightOfString(row.name, {
      width: textWidth(this.nameColumnWidth),
    });
    doc.font('Helvetica').fontSize(7);
    const cpfHeight = doc.heightOfString(`CPF: ${row.cpf}`, {
      width: textWidth(this.nameColumnWidth),
    });

    doc.font('Helvetica').fontSize(8);
    const contactHeight =
      doc.heightOfString(row.email, {
        width: textWidth(this.contactColumnWidth),
      }) +
      doc.heightOfString(row.phone, {
        width: textWidth(this.contactColumnWidth),
      }) +
      4;

    const otherHeights = this.columns.map((column) =>
      doc.heightOfString(row[column.key], {
        width: textWidth(column.width),
      }),
    );

    return Math.max(
      this.rowMinHeight,
      nameHeight + cpfHeight + this.cellPadding * 2 + 4,
      contactHeight + this.cellPadding * 2,
      ...otherHeights.map((height) => height + this.cellPadding * 2),
    );
  }

  private allColumns(): Array<{ label: string; width: number }> {
    return [
      { label: 'Nome', width: this.nameColumnWidth },
      this.columns[0],
      { label: 'Contato', width: this.contactColumnWidth },
      this.columns[1],
      this.columns[2],
    ];
  }

  private cellWidthAtX(x: number): number {
    const columns = this.allColumns();
    let currentX = this.margin;

    for (const column of columns) {
      if (currentX === x) {
        return column.width;
      }
      currentX += column.width;
    }

    return columns[columns.length - 1].width;
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
        .text(`Pagina ${pageNumber} de ${range.count}`, this.margin, footerY, {
          width: doc.page.width - this.margin * 2,
          align: 'center',
        })
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
