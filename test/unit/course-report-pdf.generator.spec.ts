import { CourseReportPdfGenerator } from '../../src/adapters/out/pdf/course-report-pdf.generator';

describe('CourseReportPdfGenerator', () => {
  it('should generate a valid PDF with course report content', async () => {
    const generator = new CourseReportPdfGenerator();

    const pdf = await generator.generate({
      generatedAt: new Date('2026-05-11T20:45:30.000Z'),
      generatedBy: 'admin@test.com',
      rows: [
        {
          name: 'Curso Online',
          modality: 'ONLINE',
          address: '-',
          status: 'ATIVO',
          startDate: '23/02/2026',
          endDate: '23/03/2026',
        },
      ],
    });
    const text = pdf.toString('latin1').toLowerCase();

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(text).toContain('/count 1');
    expect(text).toContain(toPdfHex('Amores F'));
    expect(text).toContain(toPdfHex('Curso Online'));
    expect(text).toContain(toPdfHex('23/02/2026'));
    expect(text).toContain(toPdfHex('admin@test.com'));
  });
});

function toPdfHex(value: string): string {
  return Buffer.from(value).toString('hex');
}
