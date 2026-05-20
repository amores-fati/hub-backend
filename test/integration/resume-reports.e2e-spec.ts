import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { IncomingMessage, Server } from 'http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { UserRoleEnum } from '../../src/core/domain/enums/user-role.enum';
import { createIntegrationApp } from './bootstrap';

describe('ResumeReportsController (e2e)', () => {
  let app: INestApplication;
  let adminAccessToken: string;
  let studentAccessToken: string;
  let mariaResumeId: string;
  let joaoResumeId: string;
  let anaResumeId: string;

  const adminId = randomUUID();
  const nonAdminStudentId = randomUUID();
  const adminEmail = 'admin-resume-reports@test.com';
  const nonAdminEmail = 'student-resume-report-user@test.com';

  beforeAll(async () => {
    const seed = async (dataSource: DataSource) => {
      mariaResumeId = randomUUID();
      joaoResumeId = randomUUID();
      anaResumeId = randomUUID();

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

      await insertStudentWithResume(dataSource, {
        studentId: randomUUID(),
        resumeId: mariaResumeId,
        email: 'maria.resume@test.com',
        cpf: '12345678900',
        fullName: 'Maria Silva',
        activityArea: 'Backend',
        preference: 'Remoto',
        isAvailable: true,
      });
      await insertStudentWithResume(dataSource, {
        studentId: randomUUID(),
        resumeId: joaoResumeId,
        email: 'joao.resume@test.com',
        cpf: '98765432100',
        fullName: 'Joao Santos',
        activityArea: 'Backend',
        preference: 'Presencial',
        isAvailable: true,
      });
      await insertStudentWithResume(dataSource, {
        studentId: randomUUID(),
        resumeId: anaResumeId,
        email: 'ana.resume@test.com',
        cpf: '11122233344',
        fullName: 'Ana Frontend',
        activityArea: 'Frontend',
        preference: 'Remoto',
        isAvailable: false,
      });

      await insertLimitResumes(dataSource, 1001);
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

  it('should export selected resumes as PDF', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/admin/reports/resumes')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        mode: 'selected',
        ids: [mariaResumeId, joaoResumeId, anaResumeId],
      })
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    const body = response.body as Buffer;
    const pdfText = body.toString('latin1').toLowerCase();

    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.headers['content-disposition']).toMatch(
      /^attachment; filename="relatorio_curriculos_\d{4}-\d{2}-\d{2}_\d{6}\.pdf"$/,
    );
    expect(body.subarray(0, 4).toString()).toBe('%PDF');
    expectPdfTextFragments(pdfText, ['Maria Silv']);
    expectPdfTextFragments(pdfText, ['Joao Santos']);
    expectPdfTextFragments(pdfText, ['Ana Fr', 'ontend']);
    expectPdfTextFragments(pdfText, ['Bac', 'end', 'Remoto', 'TIV']);
    expect(pdfText).not.toContain(toPdfHex('12345678900'));
  });

  it('should export all resumes filtered by active status', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/admin/reports/resumes')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ mode: 'all', filters: { status: 'ATIVO' } })
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    const pdfText = (response.body as Buffer).toString('latin1').toLowerCase();

    expectPdfTextFragments(pdfText, ['Maria Silv']);
    expectPdfTextFragments(pdfText, ['Joao Santos']);
    expect(pdfText).not.toContain(toPdfHex('Ana Frontend'));
  });

  it('should export all resumes with combined filters', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/admin/reports/resumes')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        mode: 'all',
        filters: {
          interestArea: 'Backend',
          preference: 'Remoto',
          status: 'ATIVO',
        },
      })
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    const pdfText = (response.body as Buffer).toString('latin1').toLowerCase();

    expectPdfTextFragments(pdfText, ['Maria Silv']);
    expect(pdfText).not.toContain(toPdfHex('Joao Santos'));
    expect(pdfText).not.toContain(toPdfHex('Ana Frontend'));
  });

  it('should reject exports above the 1000 resume limit', async () => {
    await request(app.getHttpServer() as Server)
      .post('/admin/reports/resumes')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ mode: 'all' })
      .expect(400)
      .expect((res) => {
        const body = res.body as { message?: unknown };
        expect(String(body.message)).toContain('Limite de 1000 curriculos');
      });
  });

  it('should reject selected mode with an empty id list', async () => {
    await request(app.getHttpServer() as Server)
      .post('/admin/reports/resumes')
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
      .post('/admin/reports/resumes')
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .send({ mode: 'selected', ids: [mariaResumeId] })
      .expect(403);
  });
});

async function insertStudentWithResume(
  dataSource: DataSource,
  params: {
    studentId: string;
    resumeId: string;
    email: string;
    cpf: string;
    fullName: string;
    activityArea: string;
    preference: string;
    isAvailable: boolean;
  },
): Promise<void> {
  await dataSource.query(
    `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
    [params.studentId, params.email, 'not-used', UserRoleEnum.STUDENT],
  );
  await dataSource.query(
    `INSERT INTO "contacts" (id, phone, city, state, address) VALUES ($1, $2, $3, $4, $5)`,
    [params.studentId, '51999999999', 'Porto Alegre', 'RS', 'Rua Teste'],
  );
  await dataSource.query(
    `INSERT INTO "students" (
      id, contact_id, cpf, date_of_birth, gender, race, full_name, activity_area
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      params.studentId,
      params.studentId,
      params.cpf,
      '1995-05-20',
      'FEMALE',
      'BROWN',
      params.fullName,
      params.activityArea,
    ],
  );
  await dataSource.query(
    `INSERT INTO "curriculum" (
      id, student_id, is_available, about, preference
    ) VALUES ($1, $2, $3, $4, $5)`,
    [
      params.resumeId,
      params.studentId,
      params.isAvailable,
      `Resumo de ${params.fullName}`,
      params.preference,
    ],
  );
}

async function insertLimitResumes(
  dataSource: DataSource,
  count: number,
): Promise<void> {
  const userParams: unknown[] = [];
  const contactParams: unknown[] = [];
  const studentParams: unknown[] = [];
  const curriculumParams: unknown[] = [];
  const userValues: string[] = [];
  const contactValues: string[] = [];
  const studentValues: string[] = [];
  const curriculumValues: string[] = [];

  for (let index = 0; index < count; index++) {
    const studentId = randomUUID();
    const resumeId = randomUUID();
    const cpf = String(90000000000 + index).padStart(11, '0');

    userValues.push(
      `($${userParams.length + 1}, $${userParams.length + 2}, $${userParams.length + 3}, $${userParams.length + 4})`,
    );
    userParams.push(
      studentId,
      `limit-resume-${index}@test.com`,
      'not-used',
      UserRoleEnum.STUDENT,
    );

    contactValues.push(
      `($${contactParams.length + 1}, $${contactParams.length + 2}, $${contactParams.length + 3}, $${contactParams.length + 4})`,
    );
    contactParams.push(studentId, '51900000000', 'Porto Alegre', 'RS');

    studentValues.push(
      `($${studentParams.length + 1}, $${studentParams.length + 2}, $${studentParams.length + 3}, $${studentParams.length + 4}, $${studentParams.length + 5}, $${studentParams.length + 6}, $${studentParams.length + 7}, $${studentParams.length + 8})`,
    );
    studentParams.push(
      studentId,
      studentId,
      cpf,
      '1995-05-20',
      'MALE',
      'WHITE',
      `Limit Resume Student ${index}`,
      'Dados',
    );

    curriculumValues.push(
      `($${curriculumParams.length + 1}, $${curriculumParams.length + 2}, $${curriculumParams.length + 3}, $${curriculumParams.length + 4}, $${curriculumParams.length + 5})`,
    );
    curriculumParams.push(
      resumeId,
      studentId,
      false,
      'Curriculo usado para validar limite',
      'Presencial',
    );
  }

  await dataSource.query(
    `INSERT INTO "users" (id, email, password_hash, role) VALUES ${userValues.join(', ')}`,
    userParams,
  );
  await dataSource.query(
    `INSERT INTO "contacts" (id, phone, city, state) VALUES ${contactValues.join(', ')}`,
    contactParams,
  );
  await dataSource.query(
    `INSERT INTO "students" (
      id, contact_id, cpf, date_of_birth, gender, race, full_name, activity_area
    ) VALUES ${studentValues.join(', ')}`,
    studentParams,
  );
  await dataSource.query(
    `INSERT INTO "curriculum" (
      id, student_id, is_available, about, preference
    ) VALUES ${curriculumValues.join(', ')}`,
    curriculumParams,
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
