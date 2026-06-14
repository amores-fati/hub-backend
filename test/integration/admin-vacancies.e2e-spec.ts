import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { createIntegrationApp } from './bootstrap';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { PaginatedAdminVacanciesResponseDto } from '../../src/adapters/in/dtos/vacancy/paginated-admin-vacancies-response.dto';

describe('AdminController (e2e) - GET /admins/vacancies/filter', () => {
  let app: INestApplication;
  let adminAccessToken: string;
  let studentAccessToken: string;
  const adminEmail = 'admin-vacancies@test.com';
  const adminPassword = 'adminpassword123';
  const studentEmail = 'student-vacancies@test.com';
  const studentPassword = 'studentpassword123';

  beforeAll(async () => {
    const seed = async (dataSource: DataSource) => {
      // Admin
      const hashedAdmin = await bcrypt.hash(adminPassword, 10);
      const adminId = randomUUID();
      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        [adminId, adminEmail, hashedAdmin, 'ADMINISTRADOR'],
      );
      await dataSource.query(`INSERT INTO "admins" (id) VALUES ($1)`, [
        adminId,
      ]);

      // Student (para testar acesso sem perfil admin)
      const hashedStudent = await bcrypt.hash(studentPassword, 10);
      const studentId = randomUUID();
      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        [studentId, studentEmail, hashedStudent, 'ESTUDANTE'],
      );
      await dataSource.query(
        `INSERT INTO "students" (id, cpf, full_name, date_of_birth, gender, race) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          studentId,
          '99988877766',
          'Estudante Teste',
          '1998-01-01',
          'MASCULINO',
          'BRANCO',
        ],
      );
      await dataSource.query(
        `INSERT INTO "telephone_student" (id, student_id, phone) VALUES ($1, $2, $3)`,
        [randomUUID(), studentId, '51900000000'],
      );
      await dataSource.query(
        `INSERT INTO "address_student" (id, student_id, city, state, cep) VALUES ($1, $2, $3, $4, $5)`,
        [randomUUID(), studentId, 'Porto Alegre', 'RS', '90000000'],
      );

      // Empresa A
      const companyAId = randomUUID();
      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        [companyAId, 'empresa-a@test.com', 'hash', 'EMPRESA'],
      );
      await dataSource.query(
        `INSERT INTO "companies" (id, cnpj, name, responsible_name) VALUES ($1, $2, $3, $4)`,
        [companyAId, '11111111111111', 'Empresa Alpha', 'Resp A'],
      );

      // Empresa B
      const companyBId = randomUUID();
      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        [companyBId, 'empresa-b@test.com', 'hash', 'EMPRESA'],
      );
      await dataSource.query(
        `INSERT INTO "companies" (id, cnpj, name, responsible_name) VALUES ($1, $2, $3, $4)`,
        [companyBId, '22222222222222', 'Empresa Beta', 'Resp B'],
      );

      // Vagas
      const vacancies = [
        {
          id: randomUUID(),
          companyId: companyAId,
          name: 'Estagiário Frontend',
          isPcd: false,
          workplaceType: 'presencial',
          openingsCount: 1,
        },
        {
          id: randomUUID(),
          companyId: companyAId,
          name: 'Desenvolvedor Backend',
          isPcd: true,
          workplaceType: 'online',
          openingsCount: 3,
        },
        {
          id: randomUUID(),
          companyId: companyBId,
          name: 'Designer UX',
          isPcd: false,
          workplaceType: 'híbrida',
          openingsCount: 2,
        },
        {
          id: randomUUID(),
          companyId: companyBId,
          name: 'Analista de Dados',
          isPcd: true,
          workplaceType: 'presencial',
          openingsCount: 1,
        },
        {
          id: randomUUID(),
          companyId: companyAId,
          name: 'Fullstack Júnior',
          isPcd: false,
          workplaceType: 'online',
          openingsCount: 2,
        },
      ];

      for (const v of vacancies) {
        await dataSource.query(
          `INSERT INTO "job_openings" (id, company_id, name, openings_count, is_pcd, workplace_type, announcement_date) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)`,
          [
            v.id,
            v.companyId,
            v.name,
            v.openingsCount,
            v.isPcd,
            v.workplaceType,
          ],
        );
      }
    };

    app = await createIntegrationApp({ seed });

    const adminLogin = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    adminAccessToken = (adminLogin.body as { accessToken: string }).accessToken;

    const studentLogin = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email: studentEmail, password: studentPassword });
    studentAccessToken = (studentLogin.body as { accessToken: string })
      .accessToken;
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /admins/vacancies/filter', () => {
    it('Cenário - Listagem paginada: deve retornar 5 vagas com page=1&limit=5 e total correto', async () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/vacancies/filter')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ page: 1, limit: 5 })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedAdminVacanciesResponseDto;
          expect(body.items).toHaveLength(5);
          expect(body.meta.total).toBe(5);
          expect(body.meta.page).toBe(1);
          expect(body.meta.limit).toBe(5);
          expect(body.meta.totalPages).toBe(1);
        });
    });

    it('Cenário - Filtro por PCD: deve retornar apenas vagas exclusivas para PCD', async () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/vacancies/filter')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ isPcd: true })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedAdminVacanciesResponseDto;
          expect(body.meta.total).toBe(2);
          expect(body.items.every((v) => v.isPcd)).toBe(true);
        });
    });

    it('Cenário - Filtro por tipo: deve retornar apenas vagas presenciais', async () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/vacancies/filter')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ workType: 'presencial' })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedAdminVacanciesResponseDto;
          expect(body.meta.total).toBe(2);
          expect(
            body.items.every((v) => v.workplaceType === 'presencial'),
          ).toBe(true);
        });
    });

    it('Cenário - Busca textual por título: deve retornar vagas que contenham o termo (case-insensitive)', async () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/vacancies/filter')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ search: 'ESTAGIÁRIO' })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedAdminVacanciesResponseDto;
          expect(body.meta.total).toBe(1);
          expect(body.items[0].title).toBe('Estagiário Frontend');
        });
    });

    it('Cenário - Busca textual por empresa: deve retornar vagas da empresa cujo nome contém o termo', async () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/vacancies/filter')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ search: 'beta' })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedAdminVacanciesResponseDto;
          expect(body.meta.total).toBe(2);
          expect(
            body.items.every((v) => v.companyName === 'Empresa Beta'),
          ).toBe(true);
        });
    });

    it('Cenário - Acesso sem token: deve retornar 401', async () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/vacancies/filter')
        .expect(401);
    });

    it('Cenário - Acesso sem perfil ADMIN: deve retornar 403 para token com perfil estudante', async () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/vacancies/filter')
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .expect(403);
    });

    it('deve retornar os campos corretos em cada item', async () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/vacancies/filter')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ search: 'Estagiário Frontend' })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedAdminVacanciesResponseDto;
          const item = body.items[0];
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('title');
          expect(item).toHaveProperty('companyName');
          expect(item).toHaveProperty('openingsCount');
          expect(item).toHaveProperty('isPcd');
          expect(item).toHaveProperty('announcementDate');
          expect(item).toHaveProperty('workplaceType');
        });
    });
  });
});
