import { VacancyReportPdfGenerator } from '../../src/adapters/out/pdf/vacancy-report-pdf.generator';

describe('VacancyReportPdfGenerator', () => {
  it('should generate a valid PDF with vacancy report content', async () => {
    const generator = new VacancyReportPdfGenerator();

    const pdf = await generator.generate({
      generatedAt: new Date('2026-05-14T18:45:30.000Z'),
      generatedBy: 'admin@test.com',
      rows: [
        {
          name: 'Vaga PCD',
          openingsCount: '3',
          isPcd: 'SIM',
          announcementDate: '23/04/2026',
        },
        {
          name: 'Vaga Geral',
          openingsCount: '1',
          isPcd: 'N\u00c3O',
          announcementDate: '24/04/2026',
        },
      ],
    });
    const text = pdf.toString('latin1').toLowerCase();

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(text).toContain('/count 1');
    expect(text).toContain(toPdfHex('Amores F'));
    expect(text).toContain(toPdfHex('aga PCD'));
    expect(text).toContain(toPdfHex('aga Ger'));
    expect(text).toContain(toPdfHex('al'));
    expect(text).toContain(toPdfHex('SIM'));
    expect(text).toContain(toPdfHex('23/04/2026'));
    expect(text).toContain(toPdfHex('24/04/2026'));
    expect(text).toContain(toPdfHex('admin@test.com'));
    expect(text).toContain('4ec3');
  });
});

function toPdfHex(value: string): string {
  return Buffer.from(value).toString('hex');
}
