import { DataSource } from 'typeorm';

import { buildDatabaseOptions } from '../../../config/database.config';
import { configureTestDatabaseEnvironment } from './test-db-env';

async function loadSeedModule(): Promise<typeof import('./seed')> {
  const modulePath = './seed';

  return import(modulePath) as Promise<typeof import('./seed')>;
}

async function bootstrap(): Promise<void> {
  configureTestDatabaseEnvironment();

  const dataSource = new DataSource(buildDatabaseOptions());

  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();

  const { seed } = await loadSeedModule();
  await seed();
}

bootstrap().catch((error) => {
  console.error('Erro no bootstrap do banco de teste:', error);
  process.exit(1);
});
