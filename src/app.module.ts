import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { buildDatabaseOptions } from './config/database.config';
import { AmoresFatiLogger, HttpLoggerInterceptor } from './utils/logger';

// Admin Adapters & Core
import { AdminController } from './adapters/in/controllers/admin.controller';
import { AdminReportsController } from './adapters/in/controllers/admin-reports.controller';
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
import { CourseReportService } from './core/services/course-report.service';
import { ResumeReportService } from './core/services/resume-report.service';
import { StudentReportService } from './core/services/student-report.service';
import { VacancyReportService } from './core/services/vacancy-report.service';
import { CourseRepository } from './adapters/out/repository/course.repository';
import { ResumeReportRepository } from './adapters/out/repository/resume-report.repository';
import { VacancyReportRepository } from './adapters/out/repository/vacancy-report.repository';
import { CourseReportPdfGenerator } from './adapters/out/pdf/course-report-pdf.generator';
import { ResumeReportPdfGenerator } from './adapters/out/pdf/resume-report-pdf.generator';
import { StudentReportPdfGenerator } from './adapters/out/pdf/student-report-pdf.generator';
import { VacancyReportPdfGenerator } from './adapters/out/pdf/vacancy-report-pdf.generator';
import { CourseOrmEntity } from './adapters/out/orm/course.orm-entity';
import { ICourseRepository } from './core/ports/course.repository.interface';
import { ICourseReportPdfGenerator } from './core/ports/course-report-pdf-generator.interface';
import { IResumeReportRepository } from './core/ports/resume-report.repository.interface';
import { IResumeReportPdfGenerator } from './core/ports/resume-report-pdf-generator.interface';
import { IStudentReportPdfGenerator } from './core/ports/student-report-pdf-generator.interface';
import { IVacancyReportRepository } from './core/ports/vacancy-report.repository.interface';
import { IVacancyReportPdfGenerator } from './core/ports/vacancy-report-pdf-generator.interface';

// Company Adapters & Core
import { CompanyOrmEntity } from './adapters/out/orm/company.orm-entity';
import { AdminOrmEntity } from './adapters/out/orm/admin.orm-entity';
import { CompanyController } from './adapters/in/controllers/company.controller';
import { CompanyService } from './core/services/company.service';
import { ICompanyRepository } from './core/ports/company.repository.interface';
import { CompanyRepository } from './adapters/out/repository/company.repository';
import { IJobOpeningRepository } from './core/ports/job-open.company.repository.interface';
import { JobOpeningRepository } from './adapters/out/repository/job.opening.repository';

import { DisabilityOrmEntity } from './adapters/out/orm/disability.orm-entity';
import { SocialBenefitOrmEntity } from './adapters/out/orm/social-benefit.orm-entity';
import { CurriculumOrmEntity } from './adapters/out/orm/curriculum.orm-entity';
import { CurriculumSkillOrmEntity } from './adapters/out/orm/curriculum-skill.orm-entity';
import { JobOpeningOrmEntity } from './adapters/out/orm/job-opening.orm-entity';
import { SkillOrmEntity } from './adapters/out/orm/skill.orm-entity';

// Student Adapters & Core
import { HealthController } from './adapters/in/controllers/health.controller';
import { StudentController } from './adapters/in/controllers/student.controller';
import { StudentResumeController } from './adapters/in/controllers/student-resume.controller';
import { StudentService } from './core/services/student.service';
import { StudentResumeService } from './core/services/student-resume.service';
import { StudentRepository } from './adapters/out/repository/student.repository';
import { StudentOrmEntity } from './adapters/out/orm/student.orm-entity';
import { IStudentRepository } from './core/ports/student.repository.interface';
import { CurriculumRepository } from './adapters/out/repository/curriculum.repository';
import { ICurriculumRepository } from './core/ports/curriculum.repository.interface';
import { LocalResumePhotoStorage } from './adapters/out/storage/local-resume-photo.storage';
import { IResumePhotoStorage } from './core/ports/resume-photo-storage.interface';

// Enrollment Adapters & Core
import { EnrollmentService } from './core/services/enrollment.service';
import { EnrollmentRepository } from './adapters/out/repository/enrollment.repository';
import { EnrollmentOrmEntity } from './adapters/out/orm/enrollment.orm-entity';
import { IEnrollmentRepository } from './core/ports/enrollment.repository.interface';

// Setting Adapters & Core
import { SettingController } from './adapters/in/controllers/setting.controller';
import { SettingService } from './core/services/setting.service';
import { SettingRepository } from './adapters/out/repository/setting.repository';
import { SettingOrmEntity } from './adapters/out/orm/setting.orm-entity';
import { ISettingRepository } from './core/ports/setting.repository.interface';

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
      useFactory: () => buildDatabaseOptions(),
    }),
    TypeOrmModule.forFeature([
      UserOrmEntity,
      AdminOrmEntity,
      CourseOrmEntity,
      CompanyOrmEntity,
      StudentOrmEntity,
      DisabilityOrmEntity,
      SocialBenefitOrmEntity,
      CurriculumOrmEntity,
      CurriculumSkillOrmEntity,
      SkillOrmEntity,
      SettingOrmEntity,
      EnrollmentOrmEntity,
      JobOpeningOrmEntity,
    ]),
  ],
  controllers: [
    AdminController,
    AdminReportsController,
    AuthController,
    CourseController,
    CompanyController,
    StudentController,
    StudentResumeController,
    HealthController,
    SettingController,
  ],
  providers: [
    AmoresFatiLogger,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggerInterceptor,
    },
    {
      provide: AdminService,
      useFactory: (
        userRepository: IUserRepository,
        adminRepository: IAdminRepository,
        hashService: IHashService,
        curriculumRepository: ICurriculumRepository,
        studentRepository: IStudentRepository,
        jobOpeningRepository: IJobOpeningRepository,
        companyRepository: ICompanyRepository,
      ) => {
        return new AdminService(
          userRepository,
          adminRepository,
          hashService,
          curriculumRepository,
          studentRepository,
          jobOpeningRepository,
          companyRepository,
        );
      },
      inject: [
        IUserRepository,
        IAdminRepository,
        IHashService,
        ICurriculumRepository,
        IStudentRepository,
        IJobOpeningRepository,
        ICompanyRepository,
      ],
    },
    {
      provide: IJobOpeningRepository,
      useClass: JobOpeningRepository,
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
        studentRepository: IStudentRepository,
        companyRepository: ICompanyRepository,
        adminRepository: IAdminRepository,
      ) => {
        return new AuthService(
          userRepository,
          hashService,
          tokenService,
          studentRepository,
          companyRepository,
          adminRepository,
        );
      },
      inject: [
        IUserRepository,
        IHashService,
        ITokenService,
        IStudentRepository,
        ICompanyRepository,
        IAdminRepository,
      ],
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
      provide: CourseReportService,
      useFactory: (
        courseRepository: ICourseRepository,
        pdfGenerator: CourseReportPdfGenerator,
        logger: AmoresFatiLogger,
      ) => {
        logger.setContext(CourseReportService.name);
        return new CourseReportService(courseRepository, pdfGenerator, logger);
      },
      inject: [ICourseRepository, ICourseReportPdfGenerator, AmoresFatiLogger],
    },
    {
      provide: ICourseReportPdfGenerator,
      useClass: CourseReportPdfGenerator,
    },
    {
      provide: StudentReportService,
      useFactory: (
        studentRepository: IStudentRepository,
        pdfGenerator: StudentReportPdfGenerator,
        logger: AmoresFatiLogger,
      ) => {
        logger.setContext(StudentReportService.name);
        return new StudentReportService(
          studentRepository,
          pdfGenerator,
          logger,
        );
      },
      inject: [
        IStudentRepository,
        IStudentReportPdfGenerator,
        AmoresFatiLogger,
      ],
    },
    {
      provide: IStudentReportPdfGenerator,
      useClass: StudentReportPdfGenerator,
    },
    {
      provide: VacancyReportService,
      useFactory: (
        vacancyRepository: IVacancyReportRepository,
        pdfGenerator: VacancyReportPdfGenerator,
        logger: AmoresFatiLogger,
      ) => {
        logger.setContext(VacancyReportService.name);
        return new VacancyReportService(
          vacancyRepository,
          pdfGenerator,
          logger,
        );
      },
      inject: [
        IVacancyReportRepository,
        IVacancyReportPdfGenerator,
        AmoresFatiLogger,
      ],
    },
    {
      provide: IVacancyReportRepository,
      useClass: VacancyReportRepository,
    },
    {
      provide: IVacancyReportPdfGenerator,
      useClass: VacancyReportPdfGenerator,
    },
    {
      provide: ResumeReportService,
      useFactory: (
        resumeRepository: IResumeReportRepository,
        pdfGenerator: ResumeReportPdfGenerator,
        logger: AmoresFatiLogger,
      ) => {
        logger.setContext(ResumeReportService.name);
        return new ResumeReportService(resumeRepository, pdfGenerator, logger);
      },
      inject: [
        IResumeReportRepository,
        IResumeReportPdfGenerator,
        AmoresFatiLogger,
      ],
    },
    {
      provide: IResumeReportRepository,
      useClass: ResumeReportRepository,
    },
    {
      provide: IResumeReportPdfGenerator,
      useClass: ResumeReportPdfGenerator,
    },
    {
      provide: ICourseRepository,
      useClass: CourseRepository,
    },
    {
      provide: EnrollmentService,
      useFactory: (
        enrollmentRepository: IEnrollmentRepository,
        courseRepository: ICourseRepository,
      ) => {
        return new EnrollmentService(enrollmentRepository, courseRepository);
      },
      inject: [IEnrollmentRepository, ICourseRepository],
    },
    {
      provide: IEnrollmentRepository,
      useClass: EnrollmentRepository,
    },
    {
      provide: CompanyService,
      useFactory: (
        companyRepository: ICompanyRepository,
        userRepository: IUserRepository,
        hashService: IHashService,
        vacancyRepository: IVacancyReportRepository,
        jobOpeningRepository: IJobOpeningRepository,
      ) => {
        return new CompanyService(
          companyRepository,
          userRepository,
          hashService,
          vacancyRepository,
          jobOpeningRepository,
        );
      },
      inject: [
        ICompanyRepository,
        IUserRepository,
        IHashService,
        IVacancyReportRepository,
        IJobOpeningRepository,
      ],
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
    {
      provide: StudentResumeService,
      useFactory: (
        curriculumRepository: ICurriculumRepository,
        studentRepository: IStudentRepository,
        resumePhotoStorage: IResumePhotoStorage,
      ) => {
        return new StudentResumeService(
          curriculumRepository,
          studentRepository,
          resumePhotoStorage,
        );
      },
      inject: [ICurriculumRepository, IStudentRepository, IResumePhotoStorage],
    },
    {
      provide: ICurriculumRepository,
      useClass: CurriculumRepository,
    },
    {
      provide: IResumePhotoStorage,
      useClass: LocalResumePhotoStorage,
    },
    {
      provide: SettingService,
      useFactory: (settingRepository: ISettingRepository) => {
        return new SettingService(settingRepository);
      },
      inject: [ISettingRepository],
    },
    {
      provide: ISettingRepository,
      useClass: SettingRepository,
    },
  ],
})
export class AppModule {}
