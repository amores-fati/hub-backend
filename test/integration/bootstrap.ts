import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from '../../src/config/database.config';

type SeedIntegrationDatabase = (dataSource: DataSource) => Promise<void>;

interface CreateIntegrationAppOptions {
  seed?: SeedIntegrationDatabase;
}

function configureIntegrationEnvironment(): void {
  dotenv.config({ path: '.env', quiet: true });
  dotenv.config({ path: '.env.test', override: true, quiet: true });

  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = process.env.DB_TEST_HOST ?? 'localhost';
  process.env.DB_PORT = process.env.DB_TEST_PORT ?? '5433';
  process.env.DB_NAME =
    process.env.DB_TEST_NAME ?? `${process.env.DB_NAME ?? 'api_db'}_test`;
  process.env.DB_USER = process.env.DB_TEST_USER ?? process.env.DB_USER;
  process.env.DB_PASS = process.env.DB_TEST_PASS ?? process.env.DB_PASS;
  process.env.JWT_SECRET ??= 'default-secret-key-for-dev';
}

async function prepareIntegrationDatabase(
  options: CreateIntegrationAppOptions,
): Promise<void> {
  configureIntegrationEnvironment();

  const dataSource = new DataSource(buildDatabaseOptions());

  await dataSource.initialize();
  await dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
  await dataSource.query('CREATE SCHEMA public');
  await dataSource.runMigrations();

  if (options.seed) {
    await options.seed(dataSource);
  }

  await dataSource.destroy();
}

export async function createIntegrationApp(
  options: CreateIntegrationAppOptions = {},
): Promise<INestApplication> {
  await prepareIntegrationDatabase(options);

  const { AppModule } = await import('../../src/app.module');

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true }),
  );
  await app.init();

  return app;
}
