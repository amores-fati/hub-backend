import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
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

describe('CompanyController (e2e)', () => {
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
          ownerName: 'Admin E2E',
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
          ownerName: 'Admin E2E',
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
          ownerName: 'Admin Updated',
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

  describe('/companies/:id (DELETE)', () => {
    it('should delete a company (204)', () => {
      return request(app.getHttpServer() as Server)
        .delete(`/companies/${createdCompanyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });
});
