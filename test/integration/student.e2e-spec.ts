import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { cpf } from 'cpf-cnpj-validator';
import { createIntegrationApp } from './bootstrap';

interface StudentResponse {
  id: string;
  cpf: string;
  socialName: string;
  contact: {
    city: string;
    phone: string;
  };
}

describe('StudentController (e2e)', () => {
  let app: INestApplication;
  let createdStudentId: string;
  let dynamicCpf: string;
  let accessToken: string;
  const studentEmail = `student-${Date.now()}@test.com`;
  const studentPassword = 'securepassword123';

  beforeAll(async () => {
    app = await createIntegrationApp();
    dynamicCpf = cpf.generate();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('/students (POST)', () => {
    it('should create a new student (201)', () => {
      return request(app.getHttpServer() as Server)
        .post('/students')
        .send({
          email: studentEmail,
          password: studentPassword,
          cpf: dynamicCpf,
          socialName: 'Student E2E',
          birthDate: '1995-05-20',
          gender: 'Masculino',
          race: 'Parda',
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
          const body = res.body as unknown as StudentResponse;
          expect(body.id).toBeDefined();
          expect(body.cpf).toBe(dynamicCpf);
          createdStudentId = body.id;
        });
    });

    it('should login and obtain an access token', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({
          email: studentEmail,
          password: studentPassword,
        })
        .expect(200);

      const body = response.body as { accessToken: string };
      accessToken = body.accessToken;
      expect(accessToken).toBeDefined();
    });

    it('should return 400 Bad Request for invalid payload', () => {
      return request(app.getHttpServer() as Server)
        .post('/students')
        .send({
          socialName: 'Incomplete Student',
        })
        .expect(400);
    });

    it('should return 409 Conflict if CPF already exists', () => {
      return request(app.getHttpServer() as Server)
        .post('/students')
        .send({
          email: `anotherstudent-${Date.now()}@test.com`,
          password: 'securepassword123',
          cpf: dynamicCpf,
          socialName: 'Duplicate Student',
          birthDate: '1995-05-20',
          gender: 'Feminino',
          race: 'Branca',
          contact: {
            phone: '11988888888',
          },
        })
        .expect(409);
    });
  });

  describe('/students (GET)', () => {
    it('should return an array of students (200)', () => {
      return request(app.getHttpServer() as Server)
        .get('/students')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as StudentResponse[];
          expect(Array.isArray(body)).toBe(true);
          expect(body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/students/:id (GET)', () => {
    it('should return a student by ID (200)', () => {
      return request(app.getHttpServer() as Server)
        .get(`/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as StudentResponse;
          expect(body.id).toBe(createdStudentId);
          expect(body.cpf).toBe(dynamicCpf);
        });
    });

    it('should return 404 Not Found if student does not exist', () => {
      const nonExistentUuid = '123e4567-e89b-12d3-a456-426614174000';
      return request(app.getHttpServer() as Server)
        .get(`/students/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/students/cpf/:cpf (GET)', () => {
    it('should return a student by CPF (200)', () => {
      return request(app.getHttpServer() as Server)
        .get(`/students/cpf/${dynamicCpf}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as StudentResponse;
          expect(body.id).toBe(createdStudentId);
          expect(body.cpf).toBe(dynamicCpf);
        });
    });

    it('should return 404 Not Found if student by CPF does not exist', () => {
      const nonExistentCpf = cpf.generate();
      return request(app.getHttpServer() as Server)
        .get(`/students/cpf/${nonExistentCpf}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/students/:id (PUT)', () => {
    it('should update a student completely (200)', () => {
      return request(app.getHttpServer() as Server)
        .put(`/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: `updatedstudent-${Date.now()}@test.com`,
          password: 'newpassword123',
          socialName: 'Updated Student E2E',
          birthDate: '1995-05-20',
          gender: 'Masculino',
          race: 'Parda',
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
          const body = res.body as unknown as StudentResponse;
          expect(body.socialName).toBe('Updated Student E2E');
          expect(body.contact.city).toBe('Rio de Janeiro');
        });
    });
  });

  describe('/students/:id (PATCH)', () => {
    it('should update a student partially (200)', () => {
      return request(app.getHttpServer() as Server)
        .patch(`/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          socialName: 'Patched Student E2E',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as StudentResponse;
          expect(body.socialName).toBe('Patched Student E2E');
        });
    });
  });

  describe('/students/:id (DELETE)', () => {
    it('should delete a student (204)', () => {
      return request(app.getHttpServer() as Server)
        .delete(`/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });
});
