import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

import { UserOrmEntity } from '../adapters/out/orm/user.orm-entity';
import { CourseOrmEntity } from '../adapters/out/orm/course.orm-entity';
import { StudentOrmEntity } from '../adapters/out/orm/student.orm-entity';
import { DisabilityOrmEntity } from '../adapters/out/orm/disability.orm-entity';
import { CurriculumOrmEntity } from '../adapters/out/orm/curriculum.orm-entity';
import { SocialBenefitOrmEntity } from '../adapters/out/orm/social_benefits';
import { AccessibilityResourceOrmEntity } from '../adapters/out/orm/accessibility_resourses.orm-entity';
import { SkillsJobOrmEntity } from '../adapters/out/orm/skills_job.orm-entity';
import { SkillsCurriculumOrmEntity } from '../adapters/out/orm/skills_curriculum.orm-entity';
import { ContactOrmEntity } from '../adapters/out/orm/contact.orm-entity';
import { JobOrmEntity } from '../adapters/out/orm/jobs.orm-entity';
import { AdminOrmEntity } from '../adapters/out/orm/admin.orm-entity';
import { SkillOrmEntity } from '../adapters/out/orm/skill.orm-entity';
import { CompanyOrmEntity } from '../adapters/out/orm/company.orm-entity';
import { PersonCourseOrmEntity } from '../adapters/out/orm/person_course.orm-entity';

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
  ],
  migrations: ['src/adapters/out/migrations/*.ts'],
  synchronize: false,
});
