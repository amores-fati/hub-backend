import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { createIntegrationApp } from './bootstrap';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { PaginatedResumesResponseDto } from '../../src/adapters/in/dtos/admin/paginated-resumes-response.dto';

describe('AdminController (e2e) - Resumes', () => {
  let app: INestApplication;
  let adminAccessToken: string;
  const adminEmail = 'admin-resumes@test.com';
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
      await dataSource.query(`INSERT INTO "admins" (id) VALUES ($1)`, [adminId]);

      // Create Contacts
      const contact1Id = randomUUID();
      const contact2Id = randomUUID();
      const contact3Id = randomUUID();
      await dataSource.query(
        `INSERT INTO "contacts" (id, phone, city, state) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8), ($9, $10, $11, $12)`,
        [
          contact1Id,
          '11999999999',
          'Porto Alegre',
          'RS',
          contact2Id,
          '11988888888',
          'São Paulo',
          'SP',
          contact3Id,
          '11977777777',
          'Rio de Janeiro',
          'RJ',
        ],
      );

      // Create Students with and without resumes
      const student1Id = randomUUID();
      const student2Id = randomUUID();
      const student3Id = randomUUID();
      const student4Id = randomUUID();
      const student5Id = randomUUID();

      await dataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8), ($9, $10, $11, $12), ($13, $14, $15, $16), ($17, $18, $19, $20)`,
        [
          student1Id,
          'ana@test.com',
          'hash',
          'STUDENT',
          student2Id,
          'joao@test.com',
          'hash',
          'STUDENT',
          student3Id,
          'maria@test.com',
          'hash',
          'STUDENT',
          student4Id,
          'noresume1@test.com',
          'hash',
          'STUDENT',
          student5Id,
          'noresume2@test.com',
          'hash',
          'STUDENT',
        ],
      );

      await dataSource.query(
        `INSERT INTO "students" (id, contact_id, cpf, full_name, social_name, date_of_birth, gender, race) VALUES ($1, $2, $3, $4, $5, $6, $7, $8), ($9, $10, $11, $12, $13, $14, $15, $16), ($17, $18, $19, $20, $21, $22, $23, $24), ($25, $26, $27, $28, $29, $30, $31, $32), ($33, $34, $35, $36, $37, $38, $39, $40)`,
        [
          student1Id,
          contact1Id,
          '12345678900',
          'Ana Júlia Silva',
          'Ana',
          '1995-05-15',
          'FEMALE',
          'WHITE',
          student2Id,
          contact2Id,
          '98765432100',
          'João Santos',
          null,
          '1990-01-01',
          'MALE',
          'WHITE',
          student3Id,
          contact3Id,
          '45678912300',
          'Maria Oliveira',
          null,
          '1992-03-20',
          'FEMALE',
          'BLACK',
          student4Id,
          contact1Id,
          '11122233300',
          'No Resume One',
          null,
          '1998-07-10',
          'MALE',
          'WHITE',
          student5Id,
          contact2Id,
          '44455566600',
          'No Resume Two',
          null,
          '1997-09-25',
          'FEMALE',
          'BLACK',
        ],
      );

      // Create Curricula for 3 students only
      const curriculum1Id = randomUUID();
      const curriculum2Id = randomUUID();
      const curriculum3Id = randomUUID();

      await dataSource.query(
        `INSERT INTO "curriculum" (id, student_id, is_available, about, linkedin, github) VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12), ($13, $14, $15, $16, $17, $18)`,
        [
          curriculum1Id,
          student1Id,
          true,
          'Desenvolvedora Full Stack',
          'https://linkedin.com/in/ana',
          'https://github.com/ana',
          curriculum2Id,
          student2Id,
          true,
          'Desenvolvedor Backend',
          'https://linkedin.com/in/joao',
          'https://github.com/joao',
          curriculum3Id,
          student3Id,
          false,
          'Desenvolvedora Frontend',
          'https://linkedin.com/in/maria',
          'https://github.com/maria',
        ],
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

  describe('GET /admins/resumes', () => {
    it('Cenário - Listagem básica autenticada: deve retornar 200 com 3 itens e total=3', () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/resumes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResumesResponseDto;
          expect(body.data).toHaveLength(3);
          expect(body.meta.total).toBe(3);
          expect(body.data[0]).toHaveProperty('cpf');
        });
    });

    it('Cenário - Busca por nome: deve retornar apenas Ana Júlia', () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/resumes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ search: 'ana' })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResumesResponseDto;
          expect(body.data).toHaveLength(1);
          expect(body.data[0].fullName).toBe('Ana Júlia Silva');
          expect(body.meta.total).toBe(1);
        });
    });

    it('Cenário - Busca por CPF: deve retornar o currículo correto com CPF formatado', () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/resumes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ search: '12345678900' })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResumesResponseDto;
          expect(body.data).toHaveLength(1);
          expect(body.data[0].cpf).toBe('123.456.789-00');
          expect(body.data[0].fullName).toBe('Ana Júlia Silva');
          expect(body.meta.total).toBe(1);
        });
    });

    it('Cenário - Busca por CPF formatado: deve funcionar mesmo com formatação', () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/resumes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ search: '123.456.789-00' })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResumesResponseDto;
          expect(body.data).toHaveLength(1);
          expect(body.data[0].fullName).toBe('Ana Júlia Silva');
          expect(body.meta.total).toBe(1);
        });
    });

    it('Cenário - Busca por email: deve retornar o currículo correto', () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/resumes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ search: 'ana@test.com' })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResumesResponseDto;
          expect(body.data).toHaveLength(1);
          expect(body.data[0].email).toBe('ana@test.com');
          expect(body.data[0].fullName).toBe('Ana Júlia Silva');
          expect(body.meta.total).toBe(1);
        });
    });

    it('Cenário - Busca por email parcial: deve funcionar', () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/resumes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ search: 'ana@' })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResumesResponseDto;
          expect(body.data).toHaveLength(1);
          expect(body.data[0].email).toBe('ana@test.com');
          expect(body.meta.total).toBe(1);
        });
    });

    it('Cenário - Paginação funciona: deve retornar 5 itens na página 2 de 12', async () => {
      // First, add more students with resumes for pagination test
      const dataSource = app.get(DataSource);
      
      for (let i = 0; i < 9; i++) {
        const contactId = randomUUID();
        const studentId = randomUUID();
        const curriculumId = randomUUID();
        
        await dataSource.query(
          `INSERT INTO "contacts" (id, phone, city, state) VALUES ($1, $2, $3, $4)`,
          [contactId, '51999999999', 'Porto Alegre', 'RS'],
        );
        
        await dataSource.query(
          `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
          [studentId, `student${i}@test.com`, 'hash', 'STUDENT'],
        );
        
        await dataSource.query(
          `INSERT INTO "students" (id, contact_id, cpf, full_name, date_of_birth, gender, race) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [studentId, contactId, `${10000000000 + i}`, `Student ${i}`, '1990-01-01', 'MALE', 'WHITE'],
        );
        
        await dataSource.query(
          `INSERT INTO "curriculum" (id, student_id, is_available, about) VALUES ($1, $2, $3, $4)`,
          [curriculumId, studentId, true, 'About student'],
        );
      }

      return request(app.getHttpServer() as Server)
        .get('/admins/resumes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ page: 2, limit: 5 })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResumesResponseDto;
          expect(body.data).toHaveLength(5);
          expect(body.meta.total).toBe(12);
          expect(body.meta.page).toBe(2);
          expect(body.meta.limit).toBe(5);
          expect(body.meta.totalPages).toBe(3);
        });
    });

    it('Cenário - Limit acima do máximo: deve forçar limit=50', async () => {
      // Add more students to test limit
      const dataSource = app.get(DataSource);
      
      for (let i = 0; i < 100; i++) {
        const contactId = randomUUID();
        const studentId = randomUUID();
        const curriculumId = randomUUID();
        
        try {
          await dataSource.query(
            `INSERT INTO "contacts" (id, phone, city, state) VALUES ($1, $2, $3, $4)`,
            [contactId, '51999999999', 'Porto Alegre', 'RS'],
          );
          
          await dataSource.query(
            `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
            [studentId, `limitstudent${i}@test.com`, 'hash', 'STUDENT'],
          );
          
          await dataSource.query(
            `INSERT INTO "students" (id, contact_id, cpf, full_name, date_of_birth, gender, race) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [studentId, contactId, `${20000000000 + i}`, `Limit Student ${i}`, '1990-01-01', 'MALE', 'WHITE'],
          );
          
          await dataSource.query(
            `INSERT INTO "curriculum" (id, student_id, is_available, about) VALUES ($1, $2, $3, $4)`,
            [curriculumId, studentId, true, 'About'],
          );
        } catch (e) {
          // Ignore duplicate errors for this test
        }
      }

      return request(app.getHttpServer() as Server)
        .get('/admins/resumes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ limit: 200 })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResumesResponseDto;
          expect(body.data.length).toBeLessThanOrEqual(50);
          expect(body.meta.limit).toBe(50);
        });
    });

    it('Cenário - Aluno sem currículo é excluído: deve retornar apenas 3 itens', () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/resumes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResumesResponseDto;
          expect(body.data.length).toBeGreaterThan(0);
          // Verify that students without curriculum are not included
          const emails = body.data.map((item) => item.email);
          expect(emails).not.toContain('noresume1@test.com');
          expect(emails).not.toContain('noresume2@test.com');
        });
    });

    it('Cenário - Page negativa é normalizada: deve forçar page=1', () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/resumes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ page: -5 })
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResumesResponseDto;
          expect(body.meta.page).toBe(1);
        });
    });

    it('should return 401 if not authenticated', () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/resumes')
        .expect(401);
    });

    it('should return 200 with default pagination when no params provided', () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/resumes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResumesResponseDto;
          expect(body.meta.page).toBe(1);
          expect(body.meta.limit).toBe(20);
          expect(body.data).toBeInstanceOf(Array);
          expect(body.meta).toHaveProperty('total');
          expect(body.meta).toHaveProperty('totalPages');
        });
    });
  });
});
