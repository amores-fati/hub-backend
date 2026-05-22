import { ResumeReportPdfGenerator } from '../../src/adapters/out/pdf/resume-report-pdf.generator';

describe('ResumeReportPdfGenerator', () => {
  it('should generate a valid PDF with resume report content', async () => {
    const generator = new ResumeReportPdfGenerator();

    const pdf = await generator.generate({
      generatedAt: new Date('2026-05-14T18:45:30.000Z'),
      generatedBy: 'admin@test.com',
      rows: [
        {
          studentName: 'Maria Silva',
          cpf: '123.***.***-00',
          interestArea: 'Backend',
          preference: 'Remoto',
          status: 'ATIVO',
        },
      ],
    });
    const text = pdf.toString('latin1').toLowerCase();

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(text).toContain('/count 1');
    expect(text).toContain(toPdfHex('Amores F'));
    expect(text).toContain(toPdfHex('Maria Silv'));
    expect(text).toContain(toPdfHex('123.***.***-00'));
    expect(text).not.toContain(toPdfHex('12345678900'));
    expect(text).toContain(toPdfHex('Bac'));
    expect(text).toContain(toPdfHex('end'));
    expect(text).toContain(toPdfHex('Remoto'));
    expect(text).toContain(toPdfHex('TIV'));
    expect(text).toContain(toPdfHex('admin@test.com'));
  });
});

function toPdfHex(value: string): string {
  return Buffer.from(value).toString('hex');
}
