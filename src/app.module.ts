import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';

// User Adapters & Core
import { UserController } from './adapters/in/controllers/user.controller';
import { UserService } from './core/services/user.service';
import { UserRepository } from './adapters/out/repository/user.repository';
import { UserOrmEntity } from './adapters/out/orm/user.orm-entity';
import { IUserRepository } from './core/ports/user.repository.interface';

// Course Adapters & Core
import { CourseController } from './adapters/in/controllers/course.controller';
import { CourseService } from './core/services/course.service';
import { CourseRepository } from './adapters/out/repository/course.repository';
import { CourseOrmEntity } from './adapters/out/orm/course.orm-entity';
import { ICourseRepository } from './core/ports/course.repository.interface';

// Company Adapters & Core
import { CompanyOrmEntity } from './adapters/out/orm/company.orm-entity';
import { CompanyController } from './adapters/in/controllers/company.controller';
import { CompanyService } from './core/services/company.service';
import { ICompanyRepository } from './core/ports/company.repository.interface';
import { CompanyRepository } from './adapters/out/repository/company.repository';

// Additional ORM Entities
import { ContactOrmEntity } from './adapters/out/orm/contact.orm-entity';
import { DisabilityOrmEntity } from './adapters/out/orm/disability.orm-entity';
import { SocialBenefitOrmEntity } from './adapters/out/orm/social-benefit.orm-entity';
import { AccessibilityResourceOrmEntity } from './adapters/out/orm/accessibility-resource.orm-entity';

// Student Adapters & Core
import { StudentController } from './adapters/in/controllers/student.controller';
import { StudentService } from './core/services/student.service';
import { StudentRepository } from './adapters/out/repository/student.repository';
import { StudentOrmEntity } from './adapters/out/orm/student.orm-entity';
import { IStudentRepository } from './core/ports/student.repository.interface';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    TypeOrmModule.forFeature([
      UserOrmEntity,
      CourseOrmEntity,
      CompanyOrmEntity,
      StudentOrmEntity,
      ContactOrmEntity,
      DisabilityOrmEntity,
      SocialBenefitOrmEntity,
      AccessibilityResourceOrmEntity,
    ]),
  ],
  controllers: [
    UserController,
    CourseController,
    CompanyController,
    StudentController,
  ],
  providers: [
    {
      provide: UserService,
      useFactory: (userRepository: IUserRepository) => {
        return new UserService(userRepository);
      },
      inject: [IUserRepository],
    },
    {
      provide: IUserRepository,
      useClass: UserRepository,
    },
    {
      provide: CourseService,
      useFactory: (courseRepository: ICourseRepository) => {
        return new CourseService(courseRepository);
      },
      inject: [ICourseRepository],
    },
    {
      provide: ICourseRepository,
      useClass: CourseRepository,
    },
    {
      provide: CompanyService,
      useFactory: (companyRepository: ICompanyRepository) => {
        return new CompanyService(companyRepository);
      },
      inject: [ICompanyRepository],
    },
    {
      provide: ICompanyRepository,
      useClass: CompanyRepository,
    },
    {
      provide: StudentService,
      useFactory: (studentRepository: IStudentRepository) => {
        return new StudentService(studentRepository);
      },
      inject: [IStudentRepository],
    },
    {
      provide: IStudentRepository,
      useClass: StudentRepository,
    },
  ],
})
export class AppModule {}
