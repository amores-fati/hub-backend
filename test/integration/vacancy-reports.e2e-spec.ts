import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { IncomingMessage, Server } from 'http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { UserRoleEnum } from '../../src/core/domain/enums/user-role.enum';
import { createIntegrationApp } from './bootstrap';

describe('VacancyReportsController (e2e)', () => {
  let app: INestApplication;
  let adminAccessToken: string;
  let studentAccessToken: string;
  let pcdVacancyId: string;
  let generalVacancyId: string;
  let secondPcdVacancyId: string;

  const adminId = randomUUID();
  const nonAdminStudentId = randomUUID();
  const companyId = randomUUID();
  const adminEmail = 'admin-vacancy-reports@test.com';
  const nonAdminEmail = 'student-vacancy-report-user@test.com';

  beforeAll(async () => {
    const seed = async (dataSource: DataSource) => {
      pcdVacancyId = randomUUID();
      generalVacancyId = randomUUID();
      secondPcdVacancyId = randomUUID();

      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        [adminId, adminEmail, 'not-used', UserRoleEnum.ADMIN],
      );
      await dataSource.query(`INSERT INTO "admins" (id) VALUES ($1)`, [
        adminId,
      ]);
      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        [nonAdminStudentId, nonAdminEmail, 'not-used', UserRoleEnum.STUDENT],
      );
      await insertCompany(dataSource, {
        id: companyId,
        email: 'empresa-vagas@test.com',
      });

      await insertVacancy(dataSource, {
        id: pcdVacancyId,
        companyId,
        name: 'Vaga PCD Frontend',
        openingsCount: 3,
        isPcd: true,
        announcementDate: '2026-04-23',
      });
      await insertVacancy(dataSource, {
        id: generalVacancyId,
        companyId,
        name: 'Vaga Geral Dados',
        openingsCount: 2,
        isPcd: false,
        announcementDate: '2026-04-24',
      });
      await insertVacancy(dataSource, {
        id: secondPcdVacancyId,
        companyId,
        name: 'Vaga PCD UX',
        openingsCount: 5,
        isPcd: true,
        announcementDate: '2026-04-25',
      });

      await insertLimitVacancies(dataSource, companyId, 1001);
    };

    app = await createIntegrationApp({ seed });

    const jwtService = new JwtService({
      secret: process.env.JWT_SECRET ?? 'default-secret-key-for-dev',
    });
    adminAccessToken = jwtService.sign({
      sub: adminId,
      email: adminEmail,
      role: UserRoleEnum.ADMIN,
    });
    studentAccessToken = jwtService.sign({
      sub: nonAdminStudentId,
      email: nonAdminEmail,
      role: UserRoleEnum.STUDENT,
    });
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should export selected vacancies as PDF', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/admin/reports/vacancies')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        mode: 'selected',
        ids: [pcdVacancyId, generalVacancyId, secondPcdVacancyId],
      })
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    const body = response.body as Buffer;
    const pdfText = body.toString('latin1').toLowerCase();

    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.headers['content-disposition']).toMatch(
      /^attachment; filename="relatorio_vagas_\d{4}-\d{2}-\d{2}_\d{6}\.pdf"$/,
    );
    expect(body.subarray(0, 4).toString()).toBe('%PDF');
    expectPdfTextFragments(pdfText, ['aga PCD', 'rontend']);
    expectPdfTextFragments(pdfText, ['aga Ger', 'al Dados']);
    expectPdfTextFragments(pdfText, ['UX']);
    expectPdfTextFragments(pdfText, ['23/04/2026']);
    expectPdfTextFragments(pdfText, ['SIM']);
    expect(pdfText).toContain('4ec3');
  });

  it('should export all vacancies filtered by PCD exclusivity', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/admin/reports/vacancies')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ mode: 'all', filters: { isPcd: true } })
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    const pdfText = (response.body as Buffer).toString('latin1').toLowerCase();

    expectPdfTextFragments(pdfText, ['aga PCD', 'rontend', 'UX']);
    expect(pdfText).not.toContain(toPdfHex('Dados'));
  });

  it('should reject exports above the 1000 vacancy limit', async () => {
    await request(app.getHttpServer() as Server)
      .post('/admin/reports/vacancies')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ mode: 'all' })
      .expect(400)
      .expect((res) => {
        const body = res.body as { message?: unknown };
        expect(String(body.message)).toContain('Limite de 1000 vagas');
      });
  });

  it('should reject selected mode with an empty id list', async () => {
    await request(app.getHttpServer() as Server)
      .post('/admin/reports/vacancies')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ mode: 'selected', ids: [] })
      .expect(400)
      .expect((res) => {
        const body = res.body as { message?: unknown };
        expect(String(body.message)).toContain('lista');
      });
  });

  it('should reject access from non-admin users', async () => {
    await request(app.getHttpServer() as Server)
      .post('/admin/reports/vacancies')
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .send({ mode: 'selected', ids: [pcdVacancyId] })
      .expect(403);
  });
});

async function insertCompany(
  dataSource: DataSource,
  params: {
    id: string;
    email: string;
  },
): Promise<void> {
  await dataSource.query(
    `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
    [params.id, params.email, 'not-used', UserRoleEnum.COMPANY],
  );
  await dataSource.query(
    `INSERT INTO "companies" (id, cnpj, name, responsible_name)
     VALUES ($1, $2, $3, $4)`,
    [
      params.id,
      '12.345.678/9001-10',
      'Empresa de Vagas',
      'Pessoa Responsavel',
    ],
  );
  await dataSource.query(
    `INSERT INTO "address_company" (id, company_id, city, state) VALUES ($1, $2, $3, $4)`,
    [randomUUID(), params.id, 'Porto Alegre', 'RS'],
  );
  await dataSource.query(
    `INSERT INTO "telephone_company" (id, company_id, phone) VALUES ($1, $2, $3)`,
    [randomUUID(), params.id, '51999999999'],
  );
}

async function insertVacancy(
  dataSource: DataSource,
  params: {
    id: string;
    companyId: string;
    name: string;
    openingsCount: number;
    isPcd: boolean;
    announcementDate: string;
  },
): Promise<void> {
  await dataSource.query(
    `INSERT INTO "job_openings" (
      id, company_id, name, description, openings_count, is_pcd, announcement_date
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      params.id,
      params.companyId,
      params.name,
      'Descricao da vaga',
      params.openingsCount,
      params.isPcd,
      params.announcementDate,
    ],
  );
}

async function insertLimitVacancies(
  dataSource: DataSource,
  companyId: string,
  count: number,
): Promise<void> {
  const queryParams: unknown[] = [];
  const values: string[] = [];

  for (let index = 0; index < count; index++) {
    values.push(
      `($${queryParams.length + 1}, $${queryParams.length + 2}, $${queryParams.length + 3}, $${queryParams.length + 4}, $${queryParams.length + 5}, $${queryParams.length + 6}, $${queryParams.length + 7})`,
    );
    queryParams.push(
      randomUUID(),
      companyId,
      `Limit Vacancy ${index}`,
      'Vaga usada para validar limite',
      1,
      false,
      '2026-01-01',
    );
  }

  await dataSource.query(
    `INSERT INTO "job_openings" (
      id, company_id, name, description, openings_count, is_pcd, announcement_date
    ) VALUES ${values.join(', ')}`,
    queryParams,
  );
}

function binaryParser(
  res: IncomingMessage,
  callback: (error: Error | null, body: Buffer) => void,
): void {
  const chunks: Buffer[] = [];

  res.on('data', (chunk: Buffer | string) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  res.on('end', () => callback(null, Buffer.concat(chunks)));
  res.on('error', (error: Error) => callback(error, Buffer.alloc(0)));
}

function toPdfHex(value: string): string {
  return Buffer.from(value).toString('hex');
}

function expectPdfTextFragments(pdfText: string, fragments: string[]): void {
  for (const fragment of fragments) {
    expect(pdfText).toContain(toPdfHex(fragment));
  }
}
