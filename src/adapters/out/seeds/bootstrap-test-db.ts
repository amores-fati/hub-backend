import { createRequire } from 'module';
import { DataSource } from 'typeorm';

import { buildDatabaseOptions } from '../../../config/database.config';
import { configureTestDatabaseEnvironment } from './test-db-env';

const requireModule = createRequire(__filename);

async function bootstrap(): Promise<void> {
  configureTestDatabaseEnvironment();

  const dataSource = new DataSource(buildDatabaseOptions());

  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();

  const { seed } = requireModule('./seed') as typeof import('./seed');
  await seed();
}

bootstrap().catch((error) => {
  console.error('Erro no bootstrap do banco de teste:', error);
  process.exit(1);
});
