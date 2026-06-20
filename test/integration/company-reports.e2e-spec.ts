import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import ExcelJS from 'exceljs';
import { IncomingMessage, Server } from 'http';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { UserRoleEnum } from '../../src/core/domain/enums/user-role.enum';
import { createIntegrationApp } from './bootstrap';

describe('AdminReportsController - companies (e2e)', () => {
  let app: INestApplication;
  let adminAccessToken: string;
  let companyAccessToken: string;
  let activeCompanyId: string;
  let inactiveCompanyId: string;
  let otherCompanyId: string;

  const adminId = randomUUID();
  const companyUserId = randomUUID();
  const adminEmail = 'admin-company-reports@test.com';
  const companyEmail = 'company-user-reports@test.com';

  beforeAll(async () => {
    const seed = async (dataSource: DataSource) => {
      activeCompanyId = randomUUID();
      inactiveCompanyId = randomUUID();
      otherCompanyId = randomUUID();

      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        [adminId, adminEmail, 'not-used', UserRoleEnum.ADMIN],
      );
      await dataSource.query(`INSERT INTO "admins" (id) VALUES ($1)`, [
        adminId,
      ]);

      await insertCompany(dataSource, {
        id: companyUserId,
        name: 'Token Company',
        cnpj: '11111111000111',
        email: companyEmail,
        phone: '51911111111',
        city: 'Canoas',
        state: 'RS',
        neighbourhood: 'Centro',
      });

      await insertCompany(dataSource, {
        id: activeCompanyId,
        name: 'Empresa Alpha',
        cnpj: '92797901000174',
        email: 'alpha@test.com',
        phone: '11988888888',
        city: 'Porto Alegre',
        state: 'RS',
        neighbourhood: 'Moinhos',
        createdAt: '2026-04-23T12:00:00.000Z',
      });

      await insertCompany(dataSource, {
        id: inactiveCompanyId,
        name: 'Empresa Beta',
        cnpj: '12345678000190',
        email: 'beta@test.com',
        phone: '21977777777',
        city: 'Porto Alegre',
        state: 'RS',
        neighbourhood: 'Centro',
        deletedAt: '2026-05-01T00:00:00.000Z',
      });

      await insertCompany(dataSource, {
        id: otherCompanyId,
        name: 'Empresa Gamma',
        cnpj: '22222222000122',
        email: 'gamma@test.com',
        phone: '48966666666',
        city: 'Florianopolis',
        state: 'SC',
        neighbourhood: 'Trindade',
      });
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
    companyAccessToken = jwtService.sign({
      sub: companyUserId,
      email: companyEmail,
      role: UserRoleEnum.COMPANY,
      companyId: companyUserId,
    });
  }, 90000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should export selected companies as XLSX', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/admin/reports/companies')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ mode: 'selected', ids: [activeCompanyId, inactiveCompanyId] })
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    const body = response.body as Buffer;
    const workbook = await loadWorkbook(body);
    const worksheet = workbook.getWorksheet('Empresas')!;

    expect(response.headers['content-type']).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(response.headers['content-disposition']).toMatch(
      /^attachment; filename="relatorio_empresas_\d{4}-\d{2}-\d{2}_\d{6}\.xlsx"$/,
    );
    expect(body.subarray(0, 2).toString()).toBe('PK');
    expect(worksheet.getCell('A2').value).toBe('Empresa Alpha');
    expect(worksheet.getCell('B2').value).toBe('92.797.901/0001-74');
    expect(worksheet.getCell('D2').value).toBe('(11) 98888-8888');
    expect(worksheet.getCell('I2').value).toBe('23/04/2026');
    expect(worksheet.getCell('A3').value).toBe('Empresa Beta');
    expect(worksheet.getCell('H3').value).toBe('INATIVO');
  });

  it('should export all companies filtered by state, city and status', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/admin/reports/companies')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        mode: 'all',
        filters: { state: 'RS', city: 'Porto Alegre', status: 'ATIVO' },
      })
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    const workbook = await loadWorkbook(response.body as Buffer);
    const worksheet = workbook.getWorksheet('Empresas')!;

    expect(worksheet.getCell('A2').value).toBe('Empresa Alpha');
    expect(worksheet.getCell('A3').value).toBeNull();
  });

  it('should reject selected mode with an empty id list', async () => {
    await request(app.getHttpServer() as Server)
      .post('/admin/reports/companies')
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
      .post('/admin/reports/companies')
      .set('Authorization', `Bearer ${companyAccessToken}`)
      .send({ mode: 'all' })
      .expect(403);
  });
});

async function insertCompany(
  dataSource: DataSource,
  params: {
    id: string;
    name: string;
    cnpj: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    neighbourhood: string;
    createdAt?: string;
    deletedAt?: string;
  },
): Promise<void> {
  await dataSource.query(
    `INSERT INTO "users" (id, email, password_hash, role, created_at, deleted_at)
     VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, NOW()), $6::timestamptz)`,
    [
      params.id,
      params.email,
      'not-used',
      UserRoleEnum.COMPANY,
      params.createdAt ?? null,
      params.deletedAt ?? null,
    ],
  );
  await dataSource.query(
    `INSERT INTO "companies" (id, cnpj, name, responsible_name) VALUES ($1, $2, $3, $4)`,
    [params.id, params.cnpj, params.name, 'Responsavel'],
  );
  await dataSource.query(
    `INSERT INTO "telephone_company" (id, company_id, phone) VALUES ($1, $2, $3)`,
    [params.id, params.id, params.phone],
  );
  await dataSource.query(
    `INSERT INTO "address_company" (id, company_id, city, state, neighbourhood, cep) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      params.id,
      params.id,
      params.city,
      params.state,
      params.neighbourhood,
      '90000000',
    ],
  );
}

async function loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
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
