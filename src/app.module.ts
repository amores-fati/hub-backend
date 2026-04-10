import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// User Adapters & Core
import { UserController } from './adapters/in/user/user.controller';
import { UserService } from './core/services/user.service';
import { UserRepository } from './adapters/out/user/user.repository';
import { UserOrmEntity } from './adapters/out/user/user.orm-entity';
import { IUserRepository } from './core/ports/user.repository.interface';

// Course Adapters & Core
import { CourseController } from './adapters/in/course/course.controller';
import { CourseService } from './core/services/course.service';
import { CourseRepository } from './adapters/out/course/course.repository';
import { CourseOrmEntity } from './adapters/out/course/course.orm-entity';
import { ICourseRepository } from './core/ports/course.repository.interface';
import { CompanyOrmEntity } from './adapters/out/company/company.orm-entity';
import { CompanyController } from './adapters/in/company/company.controller';
import { CompanyService } from './core/services/company.service';
import { ICompanyRepository } from './core/ports/company.repository.interface';
import { CompanyRepository } from './adapters/out/company/company.repository';

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
        entities: [UserOrmEntity, CourseOrmEntity, CompanyOrmEntity],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    TypeOrmModule.forFeature([
      UserOrmEntity,
      CourseOrmEntity,
      CompanyOrmEntity,
    ]),
  ],
  controllers: [UserController, CourseController, CompanyController],
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
  ],
})
export class AppModule {}
