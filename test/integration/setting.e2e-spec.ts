import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { createIntegrationApp } from './bootstrap';
import { SettingOrmEntity } from '../../src/adapters/out/orm/setting.orm-entity';
import { randomUUID } from 'crypto';

describe('SettingController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createIntegrationApp({
      seed: async (dataSource) => {
        await dataSource.getRepository(SettingOrmEntity).save({
          id: randomUUID(),
          key: 'whatsapp_phone',
          value: '(51) 99266-9381',
        });
      },
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('/settings/public/:key (GET)', () => {
    it('should return a public setting (200)', () => {
      return request(app.getHttpServer() as Server)
        .get('/settings/public/whatsapp_phone')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            key: 'whatsapp_phone',
            value: '(51) 99266-9381',
          });
        });
    });

    it('should return 404 with errorKind NOT_FOUND when key does not exist', () => {
      return request(app.getHttpServer() as Server)
        .get('/settings/public/non_existent_key')
        .expect(404)
        .expect((res) => {
          expect(res.body).toMatchObject({
            statusCode: 404,
            errorKind: 'NOT_FOUND',
            error: 'Not Found',
          });
        });
    });
  });
});
