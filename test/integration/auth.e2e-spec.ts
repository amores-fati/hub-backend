import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../src/app.module';
import { IUserRepository } from '../../src/core/ports/user.repository.interface';
import { User } from '../../src/core/domain/user.entity';
import { HttpExceptionFilter } from '../../src/adapters/in/filters/http-exception.filter';
import { randomUUID } from 'crypto';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: IUserRepository;

  const testEmail = `auth_e2e_${Date.now()}@test.com`;
  const testPassword = 'SenhaSegura@123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    userRepository = moduleFixture.get<IUserRepository>(IUserRepository);

    const passwordHash = await bcrypt.hash(testPassword, 10);
    const user = new User(
      randomUUID(),
      'E2E Auth User',
      testEmail,
      passwordHash,
      'student',
      new Date(),
      new Date(),
    );
    await userRepository.create(user);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login — 400 when body has no email', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ password: testPassword })
      .expect(400)
      .expect((res) => {
        const body = res.body as { statusCode: number; errorKind: string };
        expect(body.statusCode).toBe(400);
        expect(body.errorKind).toBe('VALIDATION_ERROR');
      });
  });

  it('POST /auth/login — 400 when email is invalid', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email', password: testPassword })
      .expect(400)
      .expect((res) => {
        const body = res.body as {
          statusCode: number;
          errorKind: string;
          message: string[];
        };
        expect(body.statusCode).toBe(400);
        expect(body.errorKind).toBe('VALIDATION_ERROR');
        expect(body.message).toContain('email deve ser um e-mail válido');
      });
  });

  it('POST /auth/login — 401 when email is not registered', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `nonexistent_${Date.now()}@test.com`,
        password: testPassword,
      })
      .expect(401)
      .expect((res) => {
        const body = res.body as { statusCode: number; errorKind: string };
        expect(body.statusCode).toBe(401);
        expect(body.errorKind).toBe('INVALID_CREDENTIALS');
      });
  });

  it('POST /auth/login — 401 when password is wrong', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'WrongPassword@999' })
      .expect(401)
      .expect((res) => {
        const body = res.body as { statusCode: number; errorKind: string };
        expect(body.statusCode).toBe(401);
        expect(body.errorKind).toBe('INVALID_CREDENTIALS');
      });
  });

  it('POST /auth/login — 200 with accessToken and role on valid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200)
      .expect((res) => {
        const body = res.body as { accessToken: string; role: string };
        expect(body.accessToken).toBeDefined();
        expect(typeof body.accessToken).toBe('string');
        expect(body.role).toBe('student');
      });
  });
});
