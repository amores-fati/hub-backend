import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { buildDatabaseOptions } from '../../src/config/database.config';

type SeedIntegrationDatabase = (dataSource: DataSource) => Promise<void>;

interface CreateIntegrationAppOptions {
  seed?: SeedIntegrationDatabase;
}

interface IntegrationEnvironment {
  primaryDbName?: string;
  targetDbName: string;
}

function readRecordValue(
  source: Record<string, string | undefined>,
  ...names: string[]
): string | undefined {
  for (const name of names) {
    const value = source[name];

    if (value && value.trim() !== '') {
      return value;
    }
  }

  return undefined;
}

function readProcessValue(...names: string[]): string | undefined {
  return readRecordValue(process.env, ...names);
}

function configureIntegrationEnvironment(): IntegrationEnvironment {
  const baseEnv = dotenv.config({ path: '.env', quiet: true }).parsed ?? {};
  const e2eEnv = dotenv.config({ path: '.env.e2e', quiet: true }).parsed ?? {};

  const primaryDbName = readRecordValue(baseEnv, 'DB_DATABASE');
  const targetDbName =
    readProcessValue('DB_DATABASE') ??
    readRecordValue(e2eEnv, 'DB_DATABASE') ??
    `${primaryDbName ?? 'api_db'}_e2e`;
  const targetDbHost =
    readProcessValue('DB_HOST') ??
    readRecordValue(e2eEnv, 'DB_HOST') ??
    '127.0.0.1';
  const targetDbPort =
    readProcessValue('DB_PORT') ?? readRecordValue(e2eEnv, 'DB_PORT') ?? '5436';
  const targetDbUsername =
    readProcessValue('DB_USERNAME') ??
    readRecordValue(e2eEnv, 'DB_USERNAME') ??
    readRecordValue(baseEnv, 'DB_USERNAME');
  const targetDbPassword =
    readProcessValue('DB_PASSWORD') ??
    readRecordValue(e2eEnv, 'DB_PASSWORD') ??
    readRecordValue(baseEnv, 'DB_PASSWORD');

  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = targetDbHost;
  process.env.DB_PORT = targetDbPort;
  process.env.DB_DATABASE = targetDbName;

  if (targetDbUsername) {
    process.env.DB_USERNAME = targetDbUsername;
  }

  if (targetDbPassword) {
    process.env.DB_PASSWORD = targetDbPassword;
  }

  process.env.JWT_SECRET ??= 'default-secret-key-for-dev';

  return {
    primaryDbName,
    targetDbName,
  };
}

function assertSafeIntegrationTarget({
  primaryDbName,
  targetDbName,
}: IntegrationEnvironment): void {
  if (!targetDbName) {
    throw new Error('E2E bloqueado: banco de teste nao definido.');
  }

  if (primaryDbName && primaryDbName === targetDbName) {
    throw new Error(
      `E2E bloqueado: o banco alvo "${targetDbName}" e o mesmo banco principal.`,
    );
  }

  if (!/(^|_)(test|e2e)($|_)/i.test(targetDbName)) {
    throw new Error(
      `E2E bloqueado: o banco alvo "${targetDbName}" nao parece ser um banco de E2E.`,
    );
  }
}

async function resetIntegrationData(dataSource: DataSource): Promise<void> {
  const tableNames = dataSource.entityMetadatas
    .map((metadata) => `"${metadata.tableName}"`)
    .filter((tableName, index, all) => all.indexOf(tableName) === index);

  if (tableNames.length === 0) {
    return;
  }

  await dataSource.query(
    `TRUNCATE TABLE ${tableNames.join(', ')} RESTART IDENTITY CASCADE`,
  );
}

async function prepareIntegrationDatabase(
  options: CreateIntegrationAppOptions,
): Promise<void> {
  const env = configureIntegrationEnvironment();
  assertSafeIntegrationTarget(env);

  const dataSource = new DataSource(buildDatabaseOptions());

  await dataSource.initialize();
  await dataSource.runMigrations();
  await resetIntegrationData(dataSource);

  if (options.seed) {
    await options.seed(dataSource);
  }

  await dataSource.destroy();
}

export async function createIntegrationApp(
  options: CreateIntegrationAppOptions = {},
): Promise<INestApplication> {
  await prepareIntegrationDatabase(options);

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.init();

  return app;
}
