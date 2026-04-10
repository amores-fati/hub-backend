import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Server } from 'http';

interface CompanyResponse {
  id: string;
  cnpj: string;
  name: string;
  city: string;
}

describe('CompanyController (e2e)', () => {
  let app: INestApplication;
  let createdCompanyId: string;
  let dynamicCnpj: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    dynamicCnpj = `${Date.now()}`.substring(0, 14);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/companies (POST)', () => {
    it('should create a new company (201)', () => {
      return request(app.getHttpServer() as Server)
        .post('/companies')
        .send({
          name: 'E2E Company',
          cnpj: dynamicCnpj,
          email: `test-${Date.now()}@company.com`,
          city: 'São Paulo',
          state: 'SP',
          street: 'Rua de Teste',
          neighborhood: 'Centro',
          cep: '01001000',
          number: 123,
          responsibleName: 'Admin E2E',
          phone: '11988888888',
          password: 'securepassword123',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as unknown as CompanyResponse;
          expect(body.id).toBeDefined();
          expect(body.cnpj).toBe(dynamicCnpj);
          createdCompanyId = body.id;
        });
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
          city: 'São Paulo',
          state: 'SP',
          street: 'Rua de Teste',
          neighborhood: 'Centro',
          cep: '01001000',
          number: 123,
          responsibleName: 'Admin E2E',
          phone: '11988888888',
          password: 'securepassword123',
        })
        .expect(409);
    });
  });

  describe('/companies (GET)', () => {
    it('should return an array of companies (200)', () => {
      return request(app.getHttpServer() as Server)
        .get('/companies')
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
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as CompanyResponse;
          expect(body.id).toBe(createdCompanyId);
          expect(body.cnpj).toBe(dynamicCnpj);
        });
    });

    it('should return 400 Bad Request if ID is not a valid UUID', () => {
      return request(app.getHttpServer() as Server)
        .get('/companies/12345-invalid-uuid')
        .expect(400);
    });

    it('should return 404 Not Found if company does not exist', () => {
      const nonExistentUuid = '123e4567-e89b-12d3-a456-426614174000';
      return request(app.getHttpServer() as Server)
        .get(`/companies/${nonExistentUuid}`)
        .expect(404);
    });
  });

  describe('/companies/cnpj/:cnpj (GET)', () => {
    it('should return a company by CNPJ (200)', () => {
      return request(app.getHttpServer() as Server)
        .get(`/companies/cnpj/${dynamicCnpj}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as CompanyResponse;
          expect(body.cnpj).toBe(dynamicCnpj);
        });
    });

    it('should return 404 Not Found if CNPJ does not exist', () => {
      return request(app.getHttpServer() as Server)
        .get('/companies/cnpj/00000000000000')
        .expect(404);
    });
  });

  describe('/companies/:id (PUT)', () => {
    it('should update a company completely (200)', () => {
      return request(app.getHttpServer() as Server)
        .put(`/companies/${createdCompanyId}`)
        .send({
          name: 'Updated E2E Company',
          cnpj: dynamicCnpj,
          email: 'updated@company.com',
          city: 'Rio de Janeiro',
          state: 'RJ',
          street: 'Avenida Atlântica',
          neighborhood: 'Copacabana',
          cep: '22070000',
          number: 100,
          responsibleName: 'Admin Updated',
          phone: '21999999999',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as CompanyResponse;
          expect(body.name).toBe('Updated E2E Company');
          expect(body.city).toBe('Rio de Janeiro');
        });
    });

    it('should return 400 if payload is missing required fields', () => {
      return request(app.getHttpServer() as Server)
        .put(`/companies/${createdCompanyId}`)
        .send({
          name: 'Failing Update',
        })
        .expect(400);
    });
  });

  describe('/companies/:id (PATCH)', () => {
    it('should update a company partially (200)', () => {
      return request(app.getHttpServer() as Server)
        .patch(`/companies/${createdCompanyId}`)
        .send({
          name: 'Patched E2E Company',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as CompanyResponse;
          expect(body.name).toBe('Patched E2E Company');
          expect(body.city).toBe('Rio de Janeiro');
        });
    });
  });

  describe('/companies/:id (DELETE)', () => {
    it('should delete a company (204)', () => {
      return request(app.getHttpServer() as Server)
        .delete(`/companies/${createdCompanyId}`)
        .expect(204);
    });

    it('should return 404 Not Found when deleting an already deleted company', () => {
      return request(app.getHttpServer() as Server)
        .delete(`/companies/${createdCompanyId}`)
        .expect(404);
    });
  });
});
