import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// User
import { UserController } from './adapters/in/user/user.controller';
import { UserService } from './core/services/user.service';
import { UserRepository } from './adapters/out/user/user.repository';
import { UserOrmEntity } from './adapters/out/user/user.orm-entity';

import type { IUserRepository as IUserRepositoryType } from './core/ports/user.repository.interface';
import { IUserRepository } from './core/ports/user.repository.interface';

// Course
import { CourseController } from './adapters/in/course/course.controller';
import { CourseService } from './core/services/course.service';
import { CourseRepository } from './adapters/out/course/course.repository';
import { CourseOrmEntity } from './adapters/out/course/course.orm-entity';

import type { CourseRepository as ICourseRepositoryType } from './core/ports/course.repository.interface';
import { ICourseRepository } from './core/ports/course.repository.interface';

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
        entities: [UserOrmEntity, CourseOrmEntity],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),

    TypeOrmModule.forFeature([UserOrmEntity, CourseOrmEntity]),
  ],

  controllers: [UserController, CourseController],

  providers: [
    {
      provide: IUserRepository,
      useClass: UserRepository,
    },

    {
      provide: ICourseRepository,
      useClass: CourseRepository,
    },

    {
      provide: UserService,
      useFactory: (userRepository: IUserRepositoryType) => {
        return new UserService(userRepository);
      },
      inject: [IUserRepository],
    },

    {
      provide: CourseService,
      useFactory: (courseRepository: ICourseRepositoryType) => {
        return new CourseService(courseRepository);
      },
      inject: [ICourseRepository],
    },
  ],
})
export class AppModule {}