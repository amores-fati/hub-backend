import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { createIntegrationApp } from './bootstrap';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { LocationScope } from '../../src/adapters/in/dtos/admin/get-locations.dto';

describe('AdminController (e2e) - Locations', () => {
  let app: INestApplication;
  let adminAccessToken: string;
  const adminEmail = 'admin-locations@test.com';
  const adminPassword = 'adminpassword123';

  beforeAll(async () => {
    const seed = async (dataSource: DataSource) => {
      // Create Admin
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminId = randomUUID();
      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        [adminId, adminEmail, hashedPassword, 'ADMIN'],
      );
      await dataSource.query(`INSERT INTO "admins" (id) VALUES ($1)`, [
        adminId,
      ]);

      // Create Contacts
      const contact1Id = randomUUID();
      const contact2Id = randomUUID();
      await dataSource.query(
        `INSERT INTO "contacts" (id, phone, city, state) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)`,
        [
          contact1Id,
          '11999999999',
          'Porto Alegre',
          'RS',
          contact2Id,
          '11988888888',
          'São Paulo',
          'SP',
        ],
      );

      // Create Student
      const studentId = randomUUID();
      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        [studentId, 'student-loc@test.com', 'hash', 'STUDENT'],
      );
      await dataSource.query(
        `INSERT INTO "students" (id, contact_id, cpf, full_name, date_of_birth, gender, race) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          studentId,
          contact1Id,
          '12345678901',
          'Student Loc',
          '1990-01-01',
          'MALE',
          'WHITE',
        ],
      );

      // Create Company
      const companyId = randomUUID();
      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        [companyId, 'company-loc@test.com', 'hash', 'COMPANY'],
      );
      await dataSource.query(
        `INSERT INTO "companies" (id, contact_id, cnpj, name, responsible_name) VALUES ($1, $2, $3, $4, $5)`,
        [companyId, contact2Id, '12345678901234', 'Company Loc', 'Resp Loc'],
      );
    };

    app = await createIntegrationApp({ seed });

    const loginRes = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    adminAccessToken = (loginRes.body as { accessToken: string }).accessToken;
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /admins/locations', () => {
    it('should return 401 if not authenticated', () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/locations')
        .query({ scope: LocationScope.STUDENT })
        .expect(401);
    });

    it('should return 200 and student locations', () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/locations')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ scope: LocationScope.STUDENT })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toContainEqual({ city: 'Porto Alegre', uf: 'RS' });
          expect(res.body).not.toContainEqual({ city: 'São Paulo', uf: 'SP' });
        });
    });

    it('should return 200 and company locations', () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/locations')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ scope: LocationScope.COMPANY })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toContainEqual({ city: 'São Paulo', uf: 'SP' });
          expect(res.body).not.toContainEqual({
            city: 'Porto Alegre',
            uf: 'RS',
          });
        });
    });

    it('should return 400 for invalid scope', () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/locations')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ scope: 'INVALID' })
        .expect(400);
    });

    it('should return 400 if scope is missing', () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/locations')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(400);
    });
  });
});
