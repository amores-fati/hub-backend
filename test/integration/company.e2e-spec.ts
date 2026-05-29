import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { execSync } from 'child_process';
import { cnpj } from 'cpf-cnpj-validator';
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

  describe('/companies/me/vacancies (POST) and /companies/me/vacancies/:id (PUT)', () => {
    let vacancyId: string;

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
          workplaceType: 'hybrid',
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
      expect(body.workplaceType).toBe('hybrid');
      vacancyId = body.id;
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
          workplaceType: 'presential',
        })
        .expect(404);
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
