import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';

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

// Auth Adapters & Core
import { AuthController } from './adapters/in/auth/auth.controller';
import { AuthService } from './core/services/auth.service';
import { BcryptHashService } from './adapters/out/auth/bcrypt-hash.service';
import { JwtTokenService } from './adapters/out/auth/jwt-token.service';
import { IHashService } from './core/ports/hash.service.interface';
import { ITokenService } from './core/ports/token.service.interface';

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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'changeme',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [UserController, CourseController, AuthController],
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
      provide: AuthService,
      useFactory: (
        userRepository: IUserRepository,
        hashService: IHashService,
        tokenService: ITokenService,
      ) => new AuthService(userRepository, hashService, tokenService),
      inject: [IUserRepository, IHashService, ITokenService],
    },
    {
      provide: IHashService,
      useClass: BcryptHashService,
    },
    {
      provide: ITokenService,
      useFactory: (jwtService: JwtService) => new JwtTokenService(jwtService),
      inject: [JwtService],
    },
  ],
})
export class AppModule {}
