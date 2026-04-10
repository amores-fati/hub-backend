import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

import { UserOrmEntity } from '../adapters/out/user/user.orm-entity';
import { CourseOrmEntity } from '../adapters/out/course/course.orm-entity';
import { StudentOrmEntity } from '../adapters/out/student/student.orm-entity';
import { DisabilityOrmEntity } from '../adapters/out/disability/disability.orm-entity';
import { CurriculumOrmEntity } from '../adapters/out/curriculum/curriculum.orm-entity';
import { SocialBenefitOrmEntity } from '../adapters/out/social_benefits/social_benefits';
import { AccessibilityResourceOrmEntity } from '../adapters/out/accessibility_resources/accessibility_resourses.orm-entity';
import { SkillsJobOrmEntity } from '../adapters/out/skills_job/skills_job.orm-entity';
import { SkillsCurriculumOrmEntity } from '../adapters/out/skills_curriculum/skills_curriculum.orm-entity';
import { ContactOrmEntity } from '../adapters/out/contact/contact.orm-entity';
import { JobOrmEntity } from '../adapters/out/jobs/jobs.orm-entity';
import { AdminOrmEntity } from '../adapters/out/admin/admin.orm-entity';
import { EnterpriseOrmEntity } from '../adapters/out/enterprise/enterprise.orm-entity';
import { SkillOrmEntity } from '../adapters/out/skill/skill.orm-entity';
import { PersonCourseOrmEntity } from '../adapters/out/person_course/person_course.orm-entity';


dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [UserOrmEntity, CourseOrmEntity, StudentOrmEntity, DisabilityOrmEntity,
     CurriculumOrmEntity, SocialBenefitOrmEntity, AccessibilityResourceOrmEntity,
      SkillsJobOrmEntity, SkillsCurriculumOrmEntity, ContactOrmEntity, JobOrmEntity,
       AdminOrmEntity, EnterpriseOrmEntity, SkillOrmEntity, PersonCourseOrmEntity],
  migrations: ['src/adapters/out/migrations/*.ts'],
  synchronize: false,
  
});
