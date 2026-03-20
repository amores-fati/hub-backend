import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

import { UserOrmEntity } from '../adapters/out/user/user.orm-entity';
import { CourseOrmEntity } from '../adapters/out/course/course.orm-entity';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [UserOrmEntity, CourseOrmEntity],
  migrations: ['src/adapters/out/migrations/*.ts'],
  synchronize: false,
});
