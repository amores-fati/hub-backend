import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

import { UserOrmEntity } from '../adapters/out/orm/user.orm-entity';
import { CourseOrmEntity } from '../adapters/out/orm/course.orm-entity';
import { CompanyOrmEntity } from '../adapters/out/orm/company.orm-entity';
import { ContactOrmEntity } from '../adapters/out/orm/contact.orm-entity';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [
    UserOrmEntity,
    CourseOrmEntity,
    CompanyOrmEntity,
    ContactOrmEntity,
  ],
  migrations: ['src/adapters/out/migrations/*.ts'],
  synchronize: false,
});
