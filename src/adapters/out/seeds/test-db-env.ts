import * as dotenv from 'dotenv';

export function configureTestDatabaseEnvironment(): void {
  process.env.NODE_ENV = 'test';

  dotenv.config({
    path: '.env.test',
    quiet: true,
  });

  process.env.DB_HOST = process.env.DB_TEST_HOST ?? process.env.DB_HOST;
  process.env.DB_PORT = process.env.DB_TEST_PORT ?? process.env.DB_PORT;
  process.env.DB_DATABASE =
    process.env.DB_TEST_DATABASE ?? process.env.DB_DATABASE;
  process.env.DB_USERNAME =
    process.env.DB_TEST_USERNAME ?? process.env.DB_USERNAME;
  process.env.DB_PASSWORD =
    process.env.DB_TEST_PASSWORD ?? process.env.DB_PASSWORD;
}
