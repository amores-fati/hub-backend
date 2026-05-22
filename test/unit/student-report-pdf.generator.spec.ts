import { StudentReportPdfGenerator } from '../../src/adapters/out/pdf/student-report-pdf.generator';

describe('StudentReportPdfGenerator', () => {
  it('should generate a valid PDF with student report content', async () => {
    const generator = new StudentReportPdfGenerator();

    const pdf = await generator.generate({
      generatedAt: new Date('2026-05-14T18:45:30.000Z'),
      generatedBy: 'admin@test.com',
      rows: [
        {
          name: 'Maria Silva',
          cpf: '123.***.***-00',
          course: 'Curso Online',
          email: 'maria@email.com',
          phone: '(11) 98888-8888',
          location: 'Sao Paulo/SP',
          pcd: 'FISICO',
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
    expect(text).toContain(toPdfHex('ia@email.com'));
    expect(text).toContain(toPdfHex('(11) 98888-8888'));
    expect(text).toContain(toPdfHex('Curso Online'));
    expect(text).toContain(toPdfHex('admin@test.com'));
  });
});

function toPdfHex(value: string): string {
  return Buffer.from(value).toString('hex');
}
