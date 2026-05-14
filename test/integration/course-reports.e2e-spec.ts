import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { IncomingMessage, Server } from 'http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { CourseStatus } from '../../src/core/domain/course-status.enum';
import { UserRoleEnum } from '../../src/core/domain/enums/user-role.enum';
import { createIntegrationApp } from './bootstrap';

describe('AdminReportsController (e2e)', () => {
  let app: INestApplication;
  let adminAccessToken: string;
  let studentAccessToken: string;
  let activeCourseId: string;
  let inactiveCourseId: string;

  const adminId = randomUUID();
  const studentId = randomUUID();
  const adminEmail = 'admin-reports@test.com';
  const studentEmail = 'student-reports@test.com';

  beforeAll(async () => {
    const seed = async (dataSource: DataSource) => {
      activeCourseId = randomUUID();
      inactiveCourseId = randomUUID();

      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        [adminId, adminEmail, 'not-used', UserRoleEnum.ADMIN],
      );
      await dataSource.query(`INSERT INTO "admins" (id) VALUES ($1)`, [
        adminId,
      ]);
      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        [studentId, studentEmail, 'not-used', UserRoleEnum.STUDENT],
      );

      await insertCourse(dataSource, {
        id: activeCourseId,
        name: 'Curso Ativo Online',
        modality: 'ONLINE',
        status: CourseStatus.ATIVO,
      });
      await insertCourse(dataSource, {
        id: inactiveCourseId,
        name: 'Curso Inativo Presencial',
        modality: 'PRESENCIAL',
        status: CourseStatus.INATIVO,
      });
      await dataSource.query(
        `INSERT INTO "in_person_course_details" (id, course_id, address, start_date, shift, room, vacancies)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          randomUUID(),
          inactiveCourseId,
          'Porto Alegre - RS',
          '2026-02-23',
          'MANHA',
          '101',
          20,
        ],
      );
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
      sub: studentId,
      email: studentEmail,
      role: UserRoleEnum.STUDENT,
    });
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should export selected courses as PDF', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/admin/reports/courses')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ mode: 'selected', ids: [activeCourseId, inactiveCourseId] })
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    const body = response.body as Buffer;
    const pdfText = body.toString('latin1').toLowerCase();

    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.headers['content-disposition']).toMatch(
      /^attachment; filename="relatorio_cursos_\d{4}-\d{2}-\d{2}_\d{6}\.pdf"$/,
    );
    expect(body.subarray(0, 4).toString()).toBe('%PDF');
    expectPdfTextFragments(pdfText, ['Curso Ativ', 'o Online']);
    expectPdfTextFragments(pdfText, ['Curso Inativ', 'o Presencial']);
  });

  it('should export all courses filtered by active status', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/admin/reports/courses')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ mode: 'all', filters: { status: CourseStatus.ATIVO } })
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    const pdfText = (response.body as Buffer).toString('latin1').toLowerCase();

    expectPdfTextFragments(pdfText, ['Curso Ativ', 'o Online']);
    expect(pdfText).not.toContain(toPdfHex('Curso Inativ'));
  });

  it('should reject selected mode with an empty id list', async () => {
    await request(app.getHttpServer() as Server)
      .post('/admin/reports/courses')
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
      .post('/admin/reports/courses')
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .send({ mode: 'all' })
      .expect(403);
  });
});

async function insertCourse(
  dataSource: DataSource,
  params: {
    id: string;
    name: string;
    modality: string;
    status: CourseStatus;
  },
): Promise<void> {
  await dataSource.query(
    `INSERT INTO "courses" (
      id, name, banner, description, course_load, start_date, end_date,
      start_registrations, end_registrations, modality, link_access,
      vacancy_count, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      params.id,
      params.name,
      'https://fatilab.com/banner.png',
      'Descricao do curso',
      '40h',
      '2026-02-23',
      '2026-03-23',
      '2026-01-01',
      '2026-01-20',
      params.modality,
      'https://fatilab.com/cursos/teste',
      20,
      params.status,
    ],
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
