import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Server } from 'https';

describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (POST) - should create a user', () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    return request(app.getHttpServer() as Server)
      .post('/users')
      .send({ name: 'E2E User', email: uniqueEmail })
      .expect(201)
      .expect((res) => {
        const body = res.body as { id: string; email: string };
        expect(body.id).toBeDefined();
        expect(body.email).toBe(uniqueEmail);
      });
  });
});
