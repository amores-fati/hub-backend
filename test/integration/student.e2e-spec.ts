import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { cpf } from 'cpf-cnpj-validator';
import { createIntegrationApp } from './bootstrap';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

interface StudentResponse {
  id: string;
  email: string;
  cpf: string;
  activityArea?: string;
  motivation?: string;
  contact: {
    city: string;
    phone: string;
  };
}

interface AdminStudentsResponse {
  items: Array<{
    id: string;
    cpf: string;
    fullName: string;
    enrollmentStatus: string;
  }>;
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

describe('StudentController (e2e)', () => {
  let app: INestApplication;
  let createdStudentId: string;
  let softDeletedStudentId: string;
  let dynamicCpf: string;
  let accessToken: string;
  const studentEmail = `student-${Date.now()}@test.com`;
  let currentStudentEmail = studentEmail;
  const studentPassword = 'securepassword123';
  let adminAccessToken: string;
  const adminEmail = 'admin@test.com';
  const adminPassword = 'adminpassword123';

  beforeAll(async () => {
    const adminSeed = async (dataSource: DataSource) => {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminId = randomUUID();
      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
        [adminId, adminEmail, hashedPassword, 'ADMINISTRADOR'],
      );
      await dataSource.query(`INSERT INTO "admins" (id) VALUES ($1)`, [
        adminId,
      ]);
    };

    app = await createIntegrationApp({ seed: adminSeed });
    dynamicCpf = cpf.generate();
  }, 30000);

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
          fullName: 'Student Full Name',
          cpf: dynamicCpf,
          birthDate: '1995-05-20',
          gender: 'MASCULINO',
          race: 'PARDO',
          socialName: 'Student Social Name',
          courseName: 'Computer Science',
          familyIncome: 'ENTRE_1_E_3',
          contact: {
            city: 'São Paulo',
            state: 'SP',
            address: 'Rua de Teste',
            neighbourhood: 'Centro',
            cep: '01001000',
            phone: '11988888888',
          },
        })
        .expect((res) => {
          if (res.status !== 201) console.log(res.body);
          const body = res.body as unknown as StudentResponse;
          expect(res.status).toBe(201);
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

    it('should login as admin and obtain an access token', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword,
        })
        .expect(200);

      const body = response.body as { accessToken: string };
      adminAccessToken = body.accessToken;
      expect(adminAccessToken).toBeDefined();
    });

    it('should return 400 Bad Request for invalid payload', () => {
      return request(app.getHttpServer() as Server)
        .post('/students')
        .send({
          contact: {},
        })
        .expect(400);
    });

    it('should return 409 Conflict if CPF already exists', () => {
      return request(app.getHttpServer() as Server)
        .post('/students')
        .send({
          email: `anotherstudent-${Date.now()}@test.com`,
          password: 'securepassword123',
          fullName: 'Another Full Name',
          cpf: dynamicCpf,
          birthDate: '1995-05-20',
          gender: 'FEMININO',
          race: 'BRANCO',
          socialName: 'Another Social',
          courseName: 'Engineering',
          familyIncome: 'MAIS_DE_3',
          contact: {
            phone: '11988888888',
            cep: '01001000',
          },
        })
        .expect(409);
    });
  });

  describe('/students (GET)', () => {
    it('should return an array of students (200)', () => {
      return request(app.getHttpServer() as Server)
        .get('/students')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as StudentResponse[];
          expect(Array.isArray(body)).toBe(true);
          expect(body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/students/filter (GET)', () => {
    it('should return paginated admin list with masked cpf (200)', () => {
      return request(app.getHttpServer() as Server)
        .get('/students/filter')
        .query({ search: dynamicCpf, page: 1, pageSize: 20 })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as AdminStudentsResponse;
          expect(Array.isArray(body.items)).toBe(true);
          expect(body.meta).toMatchObject({
            page: 1,
            pageSize: 20,
          });
          expect(body.items[0].cpf).toMatch(/^\d{3}\.\*\*\*\.\*\*\*-\d{2}$/);
        });
    });

    it('should filter by modality (200)', () => {
      return request(app.getHttpServer() as Server)
        .get('/students/filter')
        .query({ modality: 'ONLINE', page: 1, pageSize: 20 })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as AdminStudentsResponse;
          expect(Array.isArray(body.items)).toBe(true);
        });
    });

    it('should return 400 Bad Request when pageSize is invalid', () => {
      return request(app.getHttpServer() as Server)
        .get('/students/filter')
        .query({ pageSize: 30 })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(400);
    });

    it('should not list soft-deleted students', async () => {
      const cpfToDelete = cpf.generate();
      const emailToDelete = `deleted-student-${Date.now()}@test.com`;

      const createResponse = await request(app.getHttpServer() as Server)
        .post('/students')
        .send({
          email: emailToDelete,
          password: studentPassword,
          fullName: 'Deleted Student Full Name',
          cpf: cpfToDelete,
          birthDate: '1995-05-20',
          gender: 'MASCULINO',
          race: 'PARDO',
          contact: {
            city: 'Sao Paulo',
            state: 'SP',
            address: 'Rua de Teste',
            neighbourhood: 'Centro',
            cep: '01001000',
            phone: '11977777777',
          },
        })
        .expect(201);

      softDeletedStudentId = (createResponse.body as StudentResponse).id;

      await request(app.getHttpServer() as Server)
        .delete('/students')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ ids: [softDeletedStudentId] })
        .expect(200);

      await request(app.getHttpServer() as Server)
        .get('/students/filter')
        .query({ search: cpfToDelete, page: 1, pageSize: 20 })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as AdminStudentsResponse;
          expect(body.items).toHaveLength(0);
        });
    });
  });

  describe('/students/:id (GET)', () => {
    it('should return a student by ID (200)', () => {
      return request(app.getHttpServer() as Server)
        .get(`/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
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
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });
  });

  describe('/students/cpf/:cpf (GET)', () => {
    it('should return a student by CPF (200)', () => {
      return request(app.getHttpServer() as Server)
        .get(`/students/cpf/${dynamicCpf}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
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
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });
  });

  describe('/students/:id (PUT)', () => {
    it('should update a student completely (200)', () => {
      const updatedEmail = `updatedstudent-${Date.now()}@test.com`;

      return request(app.getHttpServer() as Server)
        .put(`/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: updatedEmail,
          password: 'newpassword123',
          fullName: 'Updated Full Name',
          birthDate: '1995-05-20',
          gender: 'MASCULINO',
          race: 'PARDO',
          courseName: 'New Course',
          familyIncome: 'ATE_1_SALARIO',
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
          currentStudentEmail = updatedEmail;
          expect(body.contact.city).toBe('Rio de Janeiro');
        });
    });
  });

  describe('/students/me (PUT)', () => {
    it('should update authenticated student profile (200)', () => {
      return request(app.getHttpServer() as Server)
        .put('/students/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          phone: '11988887777',
          city: 'Rio de Janeiro',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as StudentResponse;
          expect(body.contact.phone).toBe('11988887777');
          expect(body.contact.city).toBe('Rio de Janeiro');
        });
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer() as Server)
        .put('/students/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          phone: 'telefone-invalido',
          householdSize: -1,
        })
        .expect(400);
    });

    it('should ignore cpf and email updates', () => {
      return request(app.getHttpServer() as Server)
        .put('/students/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: 'hacker@teste.com',
          cpf: '00000000000',
          phone: '11977776666',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as StudentResponse;
          expect(body.email).toBe(currentStudentEmail);
          expect(body.cpf).toBe(dynamicCpf);
          expect(body.contact.phone).toBe('11977776666');
        });
    });

    it('should return 403 if user is not student', async () => {
      // Aqui entra o teste com token de ADMIN ou COMPANY.
    });
  });

  describe('/students/:id (PATCH)', () => {
    it('should update a student partially (200)', () => {
      return request(app.getHttpServer() as Server)
        .patch(`/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          motivation: 'Patched Student Motivation',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as StudentResponse;
          expect(body.motivation).toBe('Patched Student Motivation');
        });
    });
  });

  describe('/students (DELETE)', () => {
    it('should soft-delete students (200)', () => {
      return request(app.getHttpServer() as Server)
        .delete(`/students`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ ids: [createdStudentId] })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ failed: [] });
        });
    });
  });
});
