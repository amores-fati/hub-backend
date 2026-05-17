import { join } from 'path';

import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { UserOrmEntity } from '../adapters/out/orm/user.orm-entity';
import { CourseOrmEntity } from '../adapters/out/orm/course.orm-entity';
import { StudentOrmEntity } from '../adapters/out/orm/student.orm-entity';
import { DisabilityOrmEntity } from '../adapters/out/orm/disability.orm-entity';
import { CurriculumOrmEntity } from '../adapters/out/orm/curriculum.orm-entity';
import { SocialBenefitOrmEntity } from '../adapters/out/orm/social-benefit.orm-entity';
import { JobSkillOrmEntity } from '../adapters/out/orm/job-skill.orm-entity';
import { CurriculumSkillOrmEntity } from '../adapters/out/orm/curriculum-skill.orm-entity';
import { ContactOrmEntity } from '../adapters/out/orm/contact.orm-entity';
import { JobOpeningOrmEntity } from '../adapters/out/orm/job-opening.orm-entity';
import { AdminOrmEntity } from '../adapters/out/orm/admin.orm-entity';
import { SkillOrmEntity } from '../adapters/out/orm/skill.orm-entity';
import { CompanyOrmEntity } from '../adapters/out/orm/company.orm-entity';
import { SettingOrmEntity } from '../adapters/out/orm/setting.orm-entity';
import { EnrollmentOrmEntity } from '../adapters/out/orm/enrollment.orm-entity';
import { SnakeNamingStrategy } from './snake-naming.strategy';

export const ORM_ENTITIES = [
  UserOrmEntity,
  CourseOrmEntity,
  StudentOrmEntity,
  DisabilityOrmEntity,
  CurriculumOrmEntity,
  SocialBenefitOrmEntity,
  JobSkillOrmEntity,
  CurriculumSkillOrmEntity,
  ContactOrmEntity,
  JobOpeningOrmEntity,
  AdminOrmEntity,
  CompanyOrmEntity,
  SkillOrmEntity,
  SettingOrmEntity,
  EnrollmentOrmEntity,
] as const;

type SharedDatabaseOptions = PostgresConnectionOptions;

function readRequiredEnv(name: string): string | undefined {
  const value = process.env[name];

  if (value && value.trim() !== '') {
    return value;
  }

  return undefined;
}

export function buildDatabaseOptions(
  overrides: Partial<SharedDatabaseOptions> = {},
): SharedDatabaseOptions {
  return {
    type: 'postgres',
    host: readRequiredEnv('DB_HOST'),
    port: Number(readRequiredEnv('DB_PORT') ?? 5432),
    username: readRequiredEnv('DB_USERNAME'),
    password: readRequiredEnv('DB_PASSWORD'),
    database: readRequiredEnv('DB_DATABASE'),
    entities: [...ORM_ENTITIES],
    migrations: [
      join(__dirname, '..', 'adapters', 'out', 'migrations', '*.{ts,js}'),
    ],
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: false,
    ...overrides,
  };
}
