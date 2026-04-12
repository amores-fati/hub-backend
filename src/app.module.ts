import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
      ContactOrmEntity,
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
