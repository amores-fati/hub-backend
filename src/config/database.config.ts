import { join } from 'path';

import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { UserOrmEntity } from '../adapters/out/orm/user.orm-entity';
import { CourseOrmEntity } from '../adapters/out/orm/course.orm-entity';
import { StudentOrmEntity } from '../adapters/out/orm/student.orm-entity';
import { DisabilityOrmEntity } from '../adapters/out/orm/disability.orm-entity';
import { CurriculumOrmEntity } from '../adapters/out/orm/curriculum.orm-entity';
import { SocialBenefitOrmEntity } from '../adapters/out/orm/social-benefit.orm-entity';
import { AccessibilityResourceOrmEntity } from '../adapters/out/orm/accessibility-resource.orm-entity';
import { SkillsJobOrmEntity } from '../adapters/out/orm/skills_job.orm-entity';
import { SkillsCurriculumOrmEntity } from '../adapters/out/orm/skills_curriculum.orm-entity';
import { ContactOrmEntity } from '../adapters/out/orm/contact.orm-entity';
import { JobOrmEntity } from '../adapters/out/orm/jobs.orm-entity';
import { AdminOrmEntity } from '../adapters/out/orm/admin.orm-entity';
import { SkillOrmEntity } from '../adapters/out/orm/skill.orm-entity';
import { CompanyOrmEntity } from '../adapters/out/orm/company.orm-entity';
import { PersonCourseOrmEntity } from '../adapters/out/orm/person_course.orm-entity';

export const ORM_ENTITIES = [
  UserOrmEntity,
  CourseOrmEntity,
  StudentOrmEntity,
  DisabilityOrmEntity,
  CurriculumOrmEntity,
  SocialBenefitOrmEntity,
  AccessibilityResourceOrmEntity,
  SkillsJobOrmEntity,
  SkillsCurriculumOrmEntity,
  ContactOrmEntity,
  JobOrmEntity,
  AdminOrmEntity,
  CompanyOrmEntity,
  SkillOrmEntity,
  PersonCourseOrmEntity,
] as const;

type SharedDatabaseOptions = PostgresConnectionOptions;

export function buildDatabaseOptions(
  overrides: Partial<SharedDatabaseOptions> = {},
): SharedDatabaseOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [...ORM_ENTITIES],
    migrations: [
      join(__dirname, '..', 'adapters', 'out', 'migrations', '*.{ts,js}'),
    ],
    synchronize: false,
    ...overrides,
  };
}
