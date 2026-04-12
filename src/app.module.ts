import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';

// Admin Adapters & Core
import { AdminController } from './adapters/in/controllers/admin.controller';
import { AdminService } from './core/services/admin.service';
import { AdminRepository } from './adapters/out/repository/admin.repository';
import { IAdminRepository } from './core/ports/admin.repository.interface';

// User Adapters & Core
import { UserRepository } from './adapters/out/repository/user.repository';
import { UserOrmEntity } from './adapters/out/orm/user.orm-entity';
import { IUserRepository } from './core/ports/user.repository.interface';

// Auth Adapters & Core
import { AuthController } from './adapters/in/controllers/auth.controller';
import { AuthService } from './core/services/auth.service';
import { BcryptHashService } from './adapters/out/auth/bcrypt-hash.service';
import { JwtTokenService } from './adapters/out/auth/jwt-token.service';
import { IHashService } from './core/ports/hash.service.interface';
import { ITokenService } from './core/ports/token.service.interface';
import { JwtStrategy } from './utils/strategies/jwt.strategy';

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
import { HealthController } from './adapters/in/controllers/health.controller';
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
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'default-secret-key-for-dev',
        ),
        signOptions: { expiresIn: '7d' },
      }),
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
    AdminController,
    AuthController,
    CourseController,
    CompanyController,
    StudentController,
    HealthController,
  ],
  providers: [
    {
      provide: AdminService,
      useFactory: (
        userRepository: IUserRepository,
        adminRepository: IAdminRepository,
        hashService: IHashService,
      ) => {
        return new AdminService(userRepository, adminRepository, hashService);
      },
      inject: [IUserRepository, IAdminRepository, IHashService],
    },
    {
      provide: IAdminRepository,
      useClass: AdminRepository,
    },
    {
      provide: AuthService,
      useFactory: (
        userRepository: IUserRepository,
        hashService: IHashService,
        tokenService: ITokenService,
      ) => {
        return new AuthService(userRepository, hashService, tokenService);
      },
      inject: [IUserRepository, IHashService, ITokenService],
    },
    {
      provide: IHashService,
      useClass: BcryptHashService,
    },
    {
      provide: ITokenService,
      useFactory: (jwtService: JwtService) => {
        return new JwtTokenService(jwtService);
      },
      inject: [JwtService],
    },
    JwtStrategy,
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
      useFactory: (
        companyRepository: ICompanyRepository,
        userRepository: IUserRepository,
        hashService: IHashService,
      ) => {
        return new CompanyService(
          companyRepository,
          userRepository,
          hashService,
        );
      },
      inject: [ICompanyRepository, IUserRepository, IHashService],
    },
    {
      provide: ICompanyRepository,
      useClass: CompanyRepository,
    },
    {
      provide: StudentService,
      useFactory: (
        studentRepository: IStudentRepository,
        userRepository: IUserRepository,
        hashService: IHashService,
      ) => {
        return new StudentService(
          studentRepository,
          userRepository,
          hashService,
        );
      },
      inject: [IStudentRepository, IUserRepository, IHashService],
    },
    {
      provide: IStudentRepository,
      useClass: StudentRepository,
    },
  ],
})
export class AppModule {}
