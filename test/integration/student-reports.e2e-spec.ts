import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { IncomingMessage, Server } from 'http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { CourseStatus } from '../../src/core/domain/course-status.enum';
import { EnrollmentType } from '../../src/core/domain/enrollment.entity';
import { UserRoleEnum } from '../../src/core/domain/enums/user-role.enum';
import { createIntegrationApp } from './bootstrap';

describe('StudentReportsController (e2e)', () => {
  let app: INestApplication;
  let adminAccessToken: string;
  let studentAccessToken: string;
  let mariaId: string;
  let joaoId: string;
  let anaId: string;
  let courseOnlineId: string;
  let coursePresencialId: string;

  const adminId = randomUUID();
  const nonAdminStudentId = randomUUID();
  const adminEmail = 'admin-student-reports@test.com';
  const nonAdminEmail = 'student-report-user@test.com';

  beforeAll(async () => {
    const seed = async (dataSource: DataSource) => {
      courseOnlineId = randomUUID();
      coursePresencialId = randomUUID();
      mariaId = randomUUID();
      joaoId = randomUUID();
      anaId = randomUUID();

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

      await insertCourse(dataSource, {
        id: courseOnlineId,
        name: 'Curso Online',
        modality: 'ONLINE',
      });
      await insertCourse(dataSource, {
        id: coursePresencialId,
        name: 'Curso Presencial',
        modality: 'PRESENCIAL',
      });

      await insertStudent(dataSource, {
        id: mariaId,
        email: 'maria@email.com',
        cpf: '12345678900',
        fullName: 'Maria Silva',
        phone: '11988888888',
        city: 'Sao Paulo',
        state: 'SP',
        hasDisability: true,
        disabilityType: 'fisica',
      });
      await insertStudent(dataSource, {
        id: joaoId,
        email: 'joao@email.com',
        cpf: '98765432100',
        fullName: 'Joao Santos',
        phone: '1133334444',
        city: 'Campinas',
        state: 'SP',
        hasDisability: false,
        disabilityType: null,
      });
      await insertStudent(dataSource, {
        id: anaId,
        email: 'ana@email.com',
        cpf: '11122233344',
        fullName: 'Ana Souza',
        phone: '21999998888',
        city: 'Rio de Janeiro',
        state: 'RJ',
        hasDisability: true,
        disabilityType: 'visual',
      });

      await insertEnrollment(dataSource, {
        studentId: mariaId,
        courseId: courseOnlineId,
        type: EnrollmentType.ENROLLMENT,
      });
      await insertEnrollment(dataSource, {
        studentId: mariaId,
        courseId: coursePresencialId,
        type: EnrollmentType.ENROLLMENT,
      });
      await insertEnrollment(dataSource, {
        studentId: anaId,
        courseId: coursePresencialId,
        type: EnrollmentType.INTEREST,
      });

      await insertLimitStudents(dataSource, 1001);
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

  it('should export selected students as PDF', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/admin/reports/students')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ mode: 'selected', ids: [mariaId, joaoId, anaId] })
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    const body = response.body as Buffer;
    const pdfText = body.toString('latin1').toLowerCase();

    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.headers['content-disposition']).toMatch(
      /^attachment; filename="relatorio_alunos_\d{4}-\d{2}-\d{2}_\d{6}\.pdf"$/,
    );
    expect(body.subarray(0, 4).toString()).toBe('%PDF');
    expectPdfTextFragments(pdfText, ['Maria Silv']);
    expectPdfTextFragments(pdfText, ['Joao Santos']);
    expectPdfTextFragments(pdfText, ['Ana Souza']);
    expectPdfTextFragments(pdfText, ['ia@email.com']);
    expectPdfTextFragments(pdfText, ['(11) 98888-8888']);
    expect(pdfText).not.toContain(toPdfHex('12345678900'));
  });

  it('should export all students filtered by pcd type', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/admin/reports/students')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ mode: 'all', filters: { pcdType: 'FISICO' } })
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    const pdfText = (response.body as Buffer).toString('latin1').toLowerCase();

    expectPdfTextFragments(pdfText, ['Maria Silv']);
    expect(pdfText).not.toContain(toPdfHex('Joao Santos'));
    expect(pdfText).not.toContain(toPdfHex('Ana Souza'));
  });

  it('should reject exports above the 1000 student limit', async () => {
    await request(app.getHttpServer() as Server)
      .post('/admin/reports/students')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ mode: 'all' })
      .expect(400)
      .expect((res) => {
        const body = res.body as { message?: unknown };
        expect(String(body.message)).toContain('Limite de 1000 alunos');
      });
  });

  it('should reject selected mode with an empty id list', async () => {
    await request(app.getHttpServer() as Server)
      .post('/admin/reports/students')
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
      .post('/admin/reports/students')
      .set('Authorization', `Bearer ${studentAccessToken}`)
      .send({ mode: 'selected', ids: [mariaId] })
      .expect(403);
  });
});

async function insertCourse(
  dataSource: DataSource,
  params: {
    id: string;
    name: string;
    modality: string;
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
      CourseStatus.ATIVO,
    ],
  );
}

async function insertStudent(
  dataSource: DataSource,
  params: {
    id: string;
    email: string;
    cpf: string;
    fullName: string;
    phone: string;
    city: string;
    state: string;
    hasDisability: boolean;
    disabilityType: string | null;
  },
): Promise<void> {
  await dataSource.query(
    `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
    [params.id, params.email, 'not-used', UserRoleEnum.STUDENT],
  );
  await dataSource.query(
    `INSERT INTO "contacts" (id, phone, city, state, address) VALUES ($1, $2, $3, $4, $5)`,
    [params.id, params.phone, params.city, params.state, 'Rua Teste'],
  );
  await dataSource.query(
    `INSERT INTO "students" (
      id, contact_id, cpf, date_of_birth, gender, race, full_name
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      params.id,
      params.id,
      params.cpf,
      '1995-05-20',
      'FEMALE',
      'BROWN',
      params.fullName,
    ],
  );
  await dataSource.query(
    `INSERT INTO "disabilities" (student_id, has_disability, type) VALUES ($1, $2, $3)`,
    [params.id, params.hasDisability, params.disabilityType],
  );
}

async function insertEnrollment(
  dataSource: DataSource,
  params: {
    studentId: string;
    courseId: string;
    type: EnrollmentType;
  },
): Promise<void> {
  await dataSource.query(
    `INSERT INTO "enrollments" (id, student_id, course_id, type) VALUES ($1, $2, $3, $4)`,
    [randomUUID(), params.studentId, params.courseId, params.type],
  );
}

async function insertLimitStudents(
  dataSource: DataSource,
  count: number,
): Promise<void> {
  const userParams: unknown[] = [];
  const contactParams: unknown[] = [];
  const studentParams: unknown[] = [];
  const userValues: string[] = [];
  const contactValues: string[] = [];
  const studentValues: string[] = [];

  for (let index = 0; index < count; index++) {
    const id = randomUUID();
    const email = `limit-student-${index}@test.com`;
    const cpf = String(90000000000 + index).padStart(11, '0');

    userValues.push(
      `($${userParams.length + 1}, $${userParams.length + 2}, $${userParams.length + 3}, $${userParams.length + 4})`,
    );
    userParams.push(id, email, 'not-used', UserRoleEnum.STUDENT);

    contactValues.push(
      `($${contactParams.length + 1}, $${contactParams.length + 2}, $${contactParams.length + 3}, $${contactParams.length + 4})`,
    );
    contactParams.push(id, '51900000000', 'Porto Alegre', 'RS');

    studentValues.push(
      `($${studentParams.length + 1}, $${studentParams.length + 2}, $${studentParams.length + 3}, $${studentParams.length + 4}, $${studentParams.length + 5}, $${studentParams.length + 6}, $${studentParams.length + 7})`,
    );
    studentParams.push(
      id,
      id,
      cpf,
      '1995-05-20',
      'MALE',
      'WHITE',
      `Limit Student ${index}`,
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
      id, contact_id, cpf, date_of_birth, gender, race, full_name
    ) VALUES ${studentValues.join(', ')}`,
    studentParams,
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
