import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { execSync } from 'child_process';
import { cnpj } from 'cpf-cnpj-validator';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { createIntegrationApp } from './bootstrap';

interface CompanyResponse {
  id: string;
  cnpj: string;
  name: string;
  contact: {
    city: string;
    phone: string;
  };
}

const runE2e = (() => {
  try {
    execSync('docker info', { stdio: 'ignore', timeout: 2000 });
    return true;
  } catch {
    // If Docker is not available locally, skip heavy e2e tests to allow local dev and PRs.
    // CI environments that provide Docker will still run these tests.

    console.warn('Skipping e2e tests: Docker daemon not available.');
    return false;
  }
})();

const describeOrSkip: typeof describe = runE2e ? describe : describe.skip;

describeOrSkip('CompanyController (e2e)', () => {
  let app: INestApplication;
  let createdCompanyId: string;
  let dynamicCnpj: string;
  let accessToken: string;
  const companyEmail = `test-${Date.now()}@company.com`;
  const companyPassword = 'securepassword123';

  beforeAll(async () => {
    app = await createIntegrationApp();
    dynamicCnpj = cnpj.generate();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('/companies (POST)', () => {
    it('should create a new company (201)', () => {
      return request(app.getHttpServer() as Server)
        .post('/companies')
        .send({
          name: 'E2E Company',
          cnpj: dynamicCnpj,
          email: companyEmail,
          password: companyPassword,
          responsibleName: 'Admin E2E',
          contact: {
            city: 'São Paulo',
            state: 'SP',
            address: 'Rua de Teste',
            neighbourhood: 'Centro',
            cep: '01001000',
            phone: '11988888888',
          },
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as unknown as CompanyResponse;
          expect(body.id).toBeDefined();
          expect(body.cnpj).toBe(dynamicCnpj);
          createdCompanyId = body.id;
        });
    });

    it('should login and obtain an access token', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({
          email: companyEmail,
          password: companyPassword,
        })
        .expect(200);

      const body = response.body as { accessToken: string };
      accessToken = body.accessToken;
      expect(accessToken).toBeDefined();
    });

    it('should return 400 Bad Request for invalid payload', () => {
      return request(app.getHttpServer() as Server)
        .post('/companies')
        .send({
          name: 'Incomplete Company',
        })
        .expect(400);
    });

    it('should return 409 Conflict if CNPJ already exists', () => {
      return request(app.getHttpServer() as Server)
        .post('/companies')
        .send({
          name: 'Duplicate Company',
          cnpj: dynamicCnpj,
          email: `another-${Date.now()}@company.com`,
          password: 'securepassword123',
          responsibleName: 'Admin E2E',
          contact: {
            phone: '11988888888',
            cep: '01001000',
          },
        })
        .expect(409);
    });
  });

  describe('/companies (GET)', () => {
    it('should return an array of companies (200)', () => {
      return request(app.getHttpServer() as Server)
        .get('/companies')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as CompanyResponse[];
          expect(Array.isArray(body)).toBe(true);
          expect(body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/companies/:id (GET)', () => {
    it('should return a company by ID (200)', () => {
      return request(app.getHttpServer() as Server)
        .get(`/companies/${createdCompanyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as CompanyResponse;
          expect(body.id).toBe(createdCompanyId);
          expect(body.cnpj).toBe(dynamicCnpj);
        });
    });

    it('should return 404 Not Found if company does not exist', () => {
      const nonExistentUuid = '123e4567-e89b-12d3-a456-426614174000';
      return request(app.getHttpServer() as Server)
        .get(`/companies/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/companies/:id (PUT)', () => {
    it('should update a company completely (200)', () => {
      return request(app.getHttpServer() as Server)
        .put(`/companies/${createdCompanyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated E2E Company',
          email: 'updated@company.com',
          password: 'newpassword123',
          responsibleName: 'Admin Updated',
          contact: {
            city: 'Rio de Janeiro',
            state: 'RJ',
            address: 'Avenida Atlântica',
            neighbourhood: 'Copacabana',
            cep: '22070000',
            phone: '21999999999',
          },
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as CompanyResponse;
          expect(body.name).toBe('Updated E2E Company');
          expect(body.contact.city).toBe('Rio de Janeiro');
        });
    });

    it('should partially update a company (200)', () => {
      return request(app.getHttpServer() as Server)
        .patch(`/companies/${createdCompanyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Patched E2E Company',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as CompanyResponse;
          expect(body.name).toBe('Patched E2E Company');
        });
    });
  });

  describe('/companies/me/vacancies (POST)', () => {
    it('should create a new vacancy for the authenticated company (201)', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/companies/me/vacancies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Desenvolvedor Fullstack',
          description:
            'Vaga de desenvolvedor para atuar com backend e frontend.',
          link: 'https://company.jobs/apply/fullstack',
          vacancyCount: 2,
          isPcd: false,
          workplaceType: 'hibrido',
          skills: ['TypeScript', 'NestJS', 'React'],
        })
        .expect(201);

      const body = response.body as {
        id: string;
        name: string;
        openingsCount: number;
        applicationLink: string;
        isPcd: boolean;
        workplaceType: string;
      };
      expect(body.id).toBeDefined();
      expect(body.name).toBe('Desenvolvedor Fullstack');
      expect(body.openingsCount).toBe(2);
      expect(body.applicationLink).toBe('https://company.jobs/apply/fullstack');
      expect(body.isPcd).toBe(false);
      expect(body.workplaceType).toBe('hibrido');
    });

    it('should return 400 for invalid workplaceType', () => {
      return request(app.getHttpServer() as Server)
        .post('/companies/me/vacancies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Vaga inválida',
          description: 'Teste',
          link: 'https://company.jobs/apply/test',
          vacancyCount: 1,
          isPcd: false,
          workplaceType: 'invalid-type',
        })
        .expect(400);
    });
  });

  describe('/companies/me/vacancies/:id (PUT)', () => {
    let vacancyId: string;
    let otherCompanyToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer() as Server)
        .post('/companies/me/vacancies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Vaga para atualizar',
          description: 'Descrição inicial.',
          link: 'https://company.jobs/apply/setup',
          vacancyCount: 1,
          isPcd: false,
          workplaceType: 'presencial',
        })
        .expect(201);

      vacancyId = (res.body as { id: string }).id;

      const otherCnpj = cnpj.generate();
      const otherEmail = `other-${Date.now()}@company.com`;

      await request(app.getHttpServer() as Server)
        .post('/companies')
        .send({
          name: 'Other E2E Company',
          cnpj: otherCnpj,
          email: otherEmail,
          password: companyPassword,
          responsibleName: 'Other Admin',
          contact: {
            city: 'Brasília',
            state: 'DF',
            address: 'SQN',
            neighbourhood: 'Asa Norte',
            cep: '70000000',
            phone: '61988888888',
          },
        })
        .expect(201);

      const loginRes = await request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({ email: otherEmail, password: companyPassword })
        .expect(200);

      otherCompanyToken = (loginRes.body as { accessToken: string })
        .accessToken;
    });

    it('should update an existing vacancy for the authenticated company (200)', async () => {
      const response = await request(app.getHttpServer() as Server)
        .put(`/companies/me/vacancies/${vacancyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Desenvolvedor Fullstack Senior',
          description: 'Vaga atualizada para desenvolvedor fullstack senior.',
          link: 'https://company.jobs/apply/fullstack-senior',
          vacancyCount: 1,
          isPcd: true,
          workplaceType: 'online',
          skills: ['Node.js', 'React', 'TypeScript'],
        })
        .expect(200);

      const body = response.body as {
        id: string;
        name: string;
        openingsCount: number;
        applicationLink: string;
        isPcd: boolean;
        workplaceType: string;
      };
      expect(body.id).toBe(vacancyId);
      expect(body.name).toBe('Desenvolvedor Fullstack Senior');
      expect(body.openingsCount).toBe(1);
      expect(body.applicationLink).toBe(
        'https://company.jobs/apply/fullstack-senior',
      );
      expect(body.isPcd).toBe(true);
      expect(body.workplaceType).toBe('online');
    });

    it('should return 404 when updating a non-existing vacancy', () => {
      const nonExistentVacancyId = '123e4567-e89b-12d3-a456-426614174999';
      return request(app.getHttpServer() as Server)
        .put(`/companies/me/vacancies/${nonExistentVacancyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Vaga Inexistente',
          description: 'Teste',
          link: 'https://company.jobs/apply/not-found',
          vacancyCount: 1,
          isPcd: false,
          workplaceType: 'presencial',
        })
        .expect(404);
    });

    it('should return 403 when updating a vacancy belonging to another company', () => {
      return request(app.getHttpServer() as Server)
        .put(`/companies/me/vacancies/${vacancyId}`)
        .set('Authorization', `Bearer ${otherCompanyToken}`)
        .send({
          title: 'Tentativa indevida',
          description: 'Outra empresa tentando atualizar.',
          link: 'https://company.jobs/apply/forbidden',
          vacancyCount: 1,
          isPcd: false,
          workplaceType: 'presencial',
        })
        .expect(403);
    });
  });

  describe('/companies/:id (DELETE)', () => {
    it('should delete a company (204)', () => {
      return request(app.getHttpServer() as Server)
        .delete(`/companies/${createdCompanyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });
});

describeOrSkip('CompanyController (e2e) - Filter', () => {
  let app: INestApplication;
  let adminToken: string;
  let companyToken: string;
  let inativeCompanyId: string;

  const adminEmail = 'admin-filter@test.com';
  const adminPassword = 'adminpassword123';
  const activeCompanyEmail = 'db-server@test.com';
  const activeCompanyPassword = 'companypassword123';
  const inativeCompanyEmail = 'inativa@test.com';

  beforeAll(async () => {
    const seed = async (dataSource: DataSource) => {
      // Admin
      const adminId = randomUUID();
      const hashedAdminPwd = await bcrypt.hash(adminPassword, 10);
      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        [adminId, adminEmail, hashedAdminPwd, 'ADMINISTRADOR'],
      );
      await dataSource.query(`INSERT INTO "admins" (id) VALUES ($1)`, [adminId]);

      // Empresa ativa — nome contém "db" para o cenário de busca
      const activeId = randomUUID();
      const hashedCompanyPwd = await bcrypt.hash(activeCompanyPassword, 10);
      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        [activeId, activeCompanyEmail, hashedCompanyPwd, 'EMPRESA'],
      );
      await dataSource.query(
        `INSERT INTO "companies" (id, cnpj, name, responsible_name) VALUES ($1, $2, $3, $4)`,
        [activeId, '12345678000195', 'DB Server', 'Responsável Ativo'],
      );
      await dataSource.query(
        `INSERT INTO "telephone_company" (id, company_id, phone) VALUES ($1, $2, $3)`,
        [activeId, activeId, '11999999999'],
      );
      await dataSource.query(
        `INSERT INTO "address_company" (id, company_id, cep) VALUES ($1, $2, $3)`,
        [activeId, activeId, '01001000'],
      );

      // Empresa inativa — soft-deleted via deleted_at
      inativeCompanyId = randomUUID();
      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role, deleted_at) VALUES ($1, $2, $3, $4, NOW())`,
        [inativeCompanyId, inativeCompanyEmail, 'hash', 'EMPRESA'],
      );
      await dataSource.query(
        `INSERT INTO "companies" (id, cnpj, name, responsible_name) VALUES ($1, $2, $3, $4)`,
        [inativeCompanyId, '98765432000196', 'Empresa Inativa', 'Responsável Inativo'],
      );
      await dataSource.query(
        `INSERT INTO "telephone_company" (id, company_id, phone) VALUES ($1, $2, $3)`,
        [inativeCompanyId, inativeCompanyId, '11988888888'],
      );
      await dataSource.query(
        `INSERT INTO "address_company" (id, company_id, cep) VALUES ($1, $2, $3)`,
        [inativeCompanyId, inativeCompanyId, '01001000'],
      );
    };

    app = await createIntegrationApp({ seed });

    const adminLoginRes = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);
    adminToken = (adminLoginRes.body as { accessToken: string }).accessToken;

    const companyLoginRes = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email: activeCompanyEmail, password: activeCompanyPassword })
      .expect(200);
    companyToken = (companyLoginRes.body as { accessToken: string }).accessToken;
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('/companies/filter (GET)', () => {
    it('should return paginated metadata with page and limit (200)', () => {
      return request(app.getHttpServer() as Server)
        .get('/companies/filter?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as {
            data: unknown[];
            total: number;
            page: number;
            limit: number;
          };
          expect(Array.isArray(body.data)).toBe(true);
          expect(typeof body.total).toBe('number');
          expect(body.page).toBe(1);
          expect(body.limit).toBe(10);
          expect(body.data.length).toBeLessThanOrEqual(10);
        });
    });

    it('should return only companies matching search=db, case-insensitive (200)', () => {
      return request(app.getHttpServer() as Server)
        .get('/companies/filter?search=db')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as {
            data: { name: string; cnpj: string; email: string }[];
            total: number;
          };
          expect(body.data.length).toBeGreaterThan(0);
          body.data.forEach((company) => {
            const matchesSearch =
              company.name.toLowerCase().includes('db') ||
              company.cnpj.toLowerCase().includes('db') ||
              company.email.toLowerCase().includes('db');
            expect(matchesSearch).toBe(true);
          });
        });
    });

    it('should return only ATIVO companies when status=ATIVO (200)', () => {
      return request(app.getHttpServer() as Server)
        .get('/companies/filter?status=ATIVO')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as { data: { status: string; id: string }[] };
          expect(body.data.length).toBeGreaterThan(0);
          body.data.forEach((company) => {
            expect(company.status).toBe('ATIVO');
          });
          const ids = body.data.map((c) => c.id);
          expect(ids).not.toContain(inativeCompanyId);
        });
    });

    it('should return only INATIVO companies when status=INATIVO (200)', () => {
      return request(app.getHttpServer() as Server)
        .get('/companies/filter?status=INATIVO')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as { data: { status: string; id: string }[] };
          expect(body.data.length).toBeGreaterThan(0);
          body.data.forEach((company) => {
            expect(company.status).toBe('INATIVO');
          });
          const ids = body.data.map((c) => c.id);
          expect(ids).toContain(inativeCompanyId);
        });
    });

    it('should return 401 when called without token', () => {
      return request(app.getHttpServer() as Server)
        .get('/companies/filter')
        .expect(401);
    });

    it('should return 403 when called with non-admin token', () => {
      return request(app.getHttpServer() as Server)
        .get('/companies/filter')
        .set('Authorization', `Bearer ${companyToken}`)
        .expect(403);
    });
  });
});
