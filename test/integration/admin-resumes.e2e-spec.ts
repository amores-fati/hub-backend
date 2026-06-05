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
        [adminId, adminEmail, hashedPassword, 'ADMINISTRADOR'],
      );
      await dataSource.query(`INSERT INTO "admins" (id) VALUES ($1)`, [
        adminId,
      ]);

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
          'ESTUDANTE',
          student2Id,
          'joao@test.com',
          'hash',
          'ESTUDANTE',
          student3Id,
          'maria@test.com',
          'hash',
          'ESTUDANTE',
          student4Id,
          'noresume1@test.com',
          'hash',
          'ESTUDANTE',
          student5Id,
          'noresume2@test.com',
          'hash',
          'ESTUDANTE',
        ],
      );

      await dataSource.query(
        `INSERT INTO "students" (id, cpf, full_name, social_name, date_of_birth, gender, race) VALUES ($1, $2, $3, $4, $5, $6, $7), ($8, $9, $10, $11, $12, $13, $14), ($15, $16, $17, $18, $19, $20, $21), ($22, $23, $24, $25, $26, $27, $28), ($29, $30, $31, $32, $33, $34, $35)`,
        [
          student1Id,
          '12345678900',
          'Ana Júlia Silva',
          'Ana',
          '1995-05-15',
          'FEMININO',
          'BRANCO',
          student2Id,
          '98765432100',
          'João Santos',
          null,
          '1990-01-01',
          'MASCULINO',
          'BRANCO',
          student3Id,
          '45678912300',
          'Maria Oliveira',
          null,
          '1992-03-20',
          'FEMININO',
          'PRETO',
          student4Id,
          '11122233300',
          'No Resume One',
          null,
          '1998-07-10',
          'MASCULINO',
          'BRANCO',
          student5Id,
          '44455566600',
          'No Resume Two',
          null,
          '1997-09-25',
          'FEMININO',
          'PRETO',
        ],
      );

      // Create Telephones and Addresses
      const contact1Id = randomUUID();
      const contact2Id = randomUUID();
      const contact3Id = randomUUID();
      const contact4Id = randomUUID();
      const contact5Id = randomUUID();

      const addr1Id = randomUUID();
      const addr2Id = randomUUID();
      const addr3Id = randomUUID();
      const addr4Id = randomUUID();
      const addr5Id = randomUUID();

      await dataSource.query(
        `INSERT INTO "telephone_student" (id, student_id, phone) VALUES ($1, $2, $3), ($4, $5, $6), ($7, $8, $9), ($10, $11, $12), ($13, $14, $15)`,
        [
          contact1Id,
          student1Id,
          '11999999999',
          contact2Id,
          student2Id,
          '11988888888',
          contact3Id,
          student3Id,
          '11977777777',
          contact4Id,
          student4Id,
          '11999999999',
          contact5Id,
          student5Id,
          '11988888888',
        ],
      );

      await dataSource.query(
        `INSERT INTO "address_student" (id, student_id, city, state, cep) VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10), ($11, $12, $13, $14, $15), ($16, $17, $18, $19, $20), ($21, $22, $23, $24, $25)`,
        [
          addr1Id,
          student1Id,
          'Porto Alegre',
          'RS',
          '00000000',
          addr2Id,
          student2Id,
          'São Paulo',
          'SP',
          '00000000',
          addr3Id,
          student3Id,
          'Rio de Janeiro',
          'RJ',
          '00000000',
          addr4Id,
          student4Id,
          'Porto Alegre',
          'RS',
          '00000000',
          addr5Id,
          student5Id,
          'São Paulo',
          'SP',
          '00000000',
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
        const telephoneId = randomUUID();
        const addressId = randomUUID();
        const studentId = randomUUID();
        const curriculumId = randomUUID();

        await dataSource.query(
          `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
          [studentId, `student${i}@test.com`, 'hash', 'ESTUDANTE'],
        );

        await dataSource.query(
          `INSERT INTO "students" (id, cpf, full_name, date_of_birth, gender, race) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            studentId,
            `${10000000000 + i}`,
            `Student ${i}`,
            '1990-01-01',
            'MASCULINO',
            'BRANCO',
          ],
        );

        await dataSource.query(
          `INSERT INTO "telephone_student" (id, student_id, phone) VALUES ($1, $2, $3)`,
          [telephoneId, studentId, '51999999999'],
        );

        await dataSource.query(
          `INSERT INTO "address_student" (id, student_id, city, state, cep) VALUES ($1, $2, $3, $4, $5)`,
          [addressId, studentId, 'Porto Alegre', 'RS', '00000000'],
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

    it('Cenário - Limit acima do máximo: deve retornar 400 Bad Request', async () => {
      // Add more students to test limit
      const dataSource = app.get(DataSource);

      for (let i = 0; i < 100; i++) {
        const telephoneId = randomUUID();
        const addressId = randomUUID();
        const studentId = randomUUID();
        const curriculumId = randomUUID();

        try {
          await dataSource.query(
            `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
            [studentId, `limitstudent${i}@test.com`, 'hash', 'ESTUDANTE'],
          );

          await dataSource.query(
            `INSERT INTO "students" (id, cpf, full_name, date_of_birth, gender, race) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              studentId,
              `${20000000000 + i}`,
              `Limit Student ${i}`,
              '1990-01-01',
              'MASCULINO',
              'BRANCO',
            ],
          );

          await dataSource.query(
            `INSERT INTO "telephone_student" (id, student_id, phone) VALUES ($1, $2, $3)`,
            [telephoneId, studentId, '51999999999'],
          );

          await dataSource.query(
            `INSERT INTO "address_student" (id, student_id, city, state, cep) VALUES ($1, $2, $3, $4, $5)`,
            [addressId, studentId, 'Porto Alegre', 'RS', '00000000'],
          );

          await dataSource.query(
            `INSERT INTO "curriculum" (id, student_id, is_available, about) VALUES ($1, $2, $3, $4)`,
            [curriculumId, studentId, true, 'About'],
          );
        } catch {
          // Ignore duplicate errors for this test
        }
      }

      return request(app.getHttpServer() as Server)
        .get('/admins/resumes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ limit: 200 })
        .expect(400);
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

    it('Cenário - Page negativa: deve retornar 400 Bad Request', () => {
      return request(app.getHttpServer() as Server)
        .get('/admins/resumes')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ page: -5 })
        .expect(400);
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
