import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

import { buildDatabaseOptions } from './database.config';

dotenv.config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
});

export default new DataSource(buildDatabaseOptions());
