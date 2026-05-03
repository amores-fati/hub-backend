import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';

import {
  IStudentRepository,
  PaginatedStudentListResult,
  StudentFilterQuery,
} from '../../../core/ports/student.repository.interface';
import { Student } from '../../../core/domain/student.entity';
import { Contact } from '../../../core/domain/contact.entity';
import { Disability } from '../../../core/domain/disability.entity';
import { SocialBenefit } from '../../../core/domain/social-benefit.entity';
import { SocialBenefitOrmEntity } from '../orm/social-benefit.orm-entity';
import { StudentOrmEntity } from '../orm/student.orm-entity';
import { UserOrmEntity } from '../orm/user.orm-entity';
import { ContactOrmEntity } from '../orm/contact.orm-entity';
import { DisabilityOrmEntity } from '../orm/disability.orm-entity';
import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';
import { EnrollmentOrmEntity } from '../orm/enrollment.orm-entity';
import { CourseOrmEntity } from '../orm/course.orm-entity';

type EnrollmentWithCourse = EnrollmentOrmEntity & {
  course?: CourseOrmEntity;
};

type StudentWithEnrollments = StudentOrmEntity & {
  enrollments?: EnrollmentWithCourse[];
};

@Injectable()
export class StudentRepository implements IStudentRepository {
  constructor(
    @InjectRepository(StudentOrmEntity)
    private readonly ormRepository: Repository<StudentOrmEntity>,
  ) {}

  async create(student: Student): Promise<Student> {
    const ormEntity = this.mapToOrm(student);
    const relatedRecords = this.detachChildRelations(ormEntity);

    await this.ormRepository.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.save(ormEntity.user);
        await transactionalEntityManager.save(ormEntity.contact);

        await transactionalEntityManager.save(ormEntity);

        if (relatedRecords.disability) {
          await transactionalEntityManager.save(relatedRecords.disability);
        }

        if (relatedRecords.socialBenefits.length > 0) {
          await transactionalEntityManager.save(relatedRecords.socialBenefits);
        }
      },
    );

    const savedEntity = await this.ormRepository.findOne({
      where: { id: student.id },
      relations: ['user', 'contact', 'disability', 'socialBenefits'],
    });

    return this.mapToDomain(savedEntity!);
  }

  async findAll(): Promise<Student[]> {
    const ormEntities = await this.ormRepository.find({
      relations: ['user', 'contact', 'disability', 'socialBenefits'],
    });

    return ormEntities
      .filter((entity) => entity.user !== null)
      .map((entity) => this.mapToDomain(entity));
  }

  async findAllWithFilter(
    query: StudentFilterQuery,
  ): Promise<PaginatedStudentListResult> {
    const queryBuilder = this.ormRepository
      .createQueryBuilder('student')
      .innerJoinAndSelect('student.user', 'user', 'user.deletedAt IS NULL')
      .leftJoinAndSelect('student.contact', 'contact')
      .leftJoinAndSelect('student.disability', 'disability')
      .leftJoinAndSelect('student.socialBenefits', 'socialBenefits')
      .leftJoinAndMapMany(
        'student.enrollments',
        EnrollmentOrmEntity,
        'enrollment',
        'enrollment.studentId = student.id',
      )
      .leftJoinAndMapOne(
        'enrollment.course',
        CourseOrmEntity,
        'course',
        'course.id = enrollment.courseId',
      );

    if (query.search) {
      const search = this.buildLikeFilter(query.search);
      const normalizedCpf = this.normalizeCpf(query.search);

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('student.socialName ILIKE :search', { search })
            .orWhere('student.fullName ILIKE :search', { search })
            .orWhere('user.email ILIKE :search', { search });

          if (normalizedCpf) {
            qb.orWhere(
              "regexp_replace(student.cpf, '\\D', '', 'g') ILIKE :cpf",
              { cpf: this.buildLikeFilter(normalizedCpf) },
            );
          }
        }),
      );
    }

    if (query.modality) {
      queryBuilder.andWhere('course.modality = :modality', {
        modality: query.modality,
      });
    }

    if (query.city) {
      queryBuilder.andWhere('contact.city ILIKE :city', {
        city: this.buildLikeFilter(query.city),
      });
    }

    if (query.disabilityType) {
      queryBuilder.andWhere('disability.type ILIKE :disabilityType', {
        disabilityType: this.buildLikeFilter(query.disabilityType),
      });
    }

    const [ormEntities, total] = await queryBuilder
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();

    return {
      items: ormEntities.map((entity) =>
        this.mapToListProjection(entity as StudentWithEnrollments),
      ),
      total,
    };
  }

  async findById(id: string): Promise<Student | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id },
      relations: ['user', 'contact', 'disability', 'socialBenefits'],
    });

    return ormEntity && ormEntity.user ? this.mapToDomain(ormEntity) : null;
  }

  async existsById(id: string): Promise<boolean> {
    return this.ormRepository.exists({ where: { id } });
  }

  async findByCpf(cpf: string): Promise<Student | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { cpf },
      relations: ['user', 'contact', 'disability', 'socialBenefits'],
    });

    return ormEntity && ormEntity.user ? this.mapToDomain(ormEntity) : null;
  }

  async update(student: Student): Promise<Student> {
    const ormEntity = this.mapToOrm(student);
    const relatedRecords = this.detachChildRelations(ormEntity);
    const shouldReplaceSocialBenefits =
      relatedRecords.socialBenefits.length === 0 ||
      relatedRecords.socialBenefits.some((benefit) => benefit.id == null);

    await this.ormRepository.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.save(ormEntity.user);
        await transactionalEntityManager.save(ormEntity.contact);
        await transactionalEntityManager.update(
          StudentOrmEntity,
          { id: ormEntity.id },
          this.mapStudentFieldsToUpdate(ormEntity),
        );

        if (relatedRecords.disability) {
          await transactionalEntityManager.save(relatedRecords.disability);
        }

        if (shouldReplaceSocialBenefits) {
          await transactionalEntityManager.delete(SocialBenefitOrmEntity, {
            studentId: ormEntity.id,
          });
        }

        if (relatedRecords.socialBenefits.length > 0) {
          await transactionalEntityManager.save(relatedRecords.socialBenefits);
        }
      },
    );

    const savedEntity = await this.ormRepository.findOne({
      where: { id: student.id },
      relations: ['user', 'contact', 'disability', 'socialBenefits'],
    });

    return this.mapToDomain(savedEntity!);
  }

  async delete(id: string): Promise<void> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id },
      relations: ['user', 'contact', 'disability', 'socialBenefits'],
    });

    if (ormEntity) {
      await this.ormRepository.manager.transaction(
        async (transactionalEntityManager) => {
          if (ormEntity.socialBenefits?.length > 0) {
            await transactionalEntityManager.remove(ormEntity.socialBenefits);
          }
          if (ormEntity.disability) {
            await transactionalEntityManager.remove(ormEntity.disability);
          }

          await transactionalEntityManager.remove(ormEntity);

          if (ormEntity.contact) {
            await transactionalEntityManager.remove(ormEntity.contact);
          }
          if (ormEntity.user) {
            await transactionalEntityManager.remove(ormEntity.user);
          }
        },
      );
    }
  }

  async softDeleteMany(ids: string[]): Promise<void> {
    await this.ormRepository.manager.softDelete(UserOrmEntity, { id: In(ids) });
  }

  private mapToOrm(student: Student): StudentOrmEntity {
    const ormEntity = new StudentOrmEntity();

    ormEntity.id = student.id;
    ormEntity.cpf = student.cpf;
    ormEntity.birthDate = student.birthDate;
    ormEntity.gender = student.gender;
    ormEntity.race = student.race;
    ormEntity.fullName = student.fullName;
    ormEntity.education = student.education || null;
    ormEntity.courseName = student.courseName || null;
    ormEntity.institution = student.institution || null;
    ormEntity.activityArea = student.activityArea || null;
    ormEntity.hasProgrammingExperience =
      student.hasProgrammingExperience ?? null;
    ormEntity.familyIncome = student.familyIncome || null;
    ormEntity.motivation = student.motivation || null;
    ormEntity.howHeard = student.howHeard || null;
    ormEntity.hasComputer = student.hasComputer ?? null;
    ormEntity.hasInternet = student.hasInternet ?? null;
    ormEntity.committedToParticipate = student.committedToParticipate ?? null;

    ormEntity.user = new UserOrmEntity();
    ormEntity.user.id = student.id;
    ormEntity.user.email = student.email;
    ormEntity.user.password = student.password;
    ormEntity.user.role = UserRoleEnum.STUDENT;

    ormEntity.contact = new ContactOrmEntity();
    ormEntity.contact.id = student.contact.id;
    ormEntity.contact.phone = student.contact.phone;
    ormEntity.contact.neighbourhood = student.contact.neighbourhood || null;
    ormEntity.contact.state = student.contact.state || null;
    ormEntity.contact.city = student.contact.city || null;
    ormEntity.contact.address = student.contact.address || null;
    ormEntity.contact.cep = student.contact.cep || null;
    ormEntity.contact.complement = student.contact.complement || null;

    ormEntity.disability = student.disability
      ? this.mapDisabilityToOrm(student.disability, ormEntity)
      : null;

    ormEntity.socialBenefits = student.socialBenefits.map((benefit) =>
      this.mapSocialBenefitToOrm(benefit, student.id, ormEntity),
    );

    ormEntity.socialName = student.socialName || null;

    return ormEntity;
  }

  private buildLikeFilter(value: string): string {
    return `%${value}%`;
  }

  private normalizeCpf(value: string): string | undefined {
    const digits = value.replace(/\D/g, '');
    return digits ? digits : undefined;
  }

  private mapToListProjection(ormEntity: StudentWithEnrollments) {
    return {
      id: ormEntity.id,
      email: ormEntity.user.email,
      cpf: ormEntity.cpf,
      fullName: ormEntity.fullName,
      socialName: ormEntity.socialName || undefined,
      city: ormEntity.contact.city || undefined,
      state: ormEntity.contact.state || undefined,
      hasDisability: ormEntity.disability?.hasDisability,
      disabilityType: ormEntity.disability?.type || undefined,
      enrollments: (ormEntity.enrollments ?? []).map((enrollment) => ({
        courseId: enrollment.courseId,
        courseModality: enrollment.course?.modality ?? 'ONLINE',
      })),
    };
  }

  private detachChildRelations(ormEntity: StudentOrmEntity): {
    disability: DisabilityOrmEntity | null;
    socialBenefits: SocialBenefitOrmEntity[];
  } {
    const relatedRecords = {
      disability: ormEntity.disability,
      socialBenefits: ormEntity.socialBenefits,
    };

    ormEntity.disability = null;
    ormEntity.socialBenefits = [];

    return relatedRecords;
  }

  private mapStudentFieldsToUpdate(
    ormEntity: StudentOrmEntity,
  ): Partial<StudentOrmEntity> {
    return {
      cpf: ormEntity.cpf,
      birthDate: ormEntity.birthDate,
      gender: ormEntity.gender,
      race: ormEntity.race,
      education: ormEntity.education,
      courseName: ormEntity.courseName,
      institution: ormEntity.institution,
      activityArea: ormEntity.activityArea,
      hasProgrammingExperience: ormEntity.hasProgrammingExperience,
      familyIncome: ormEntity.familyIncome,
      motivation: ormEntity.motivation,
      howHeard: ormEntity.howHeard,
      hasComputer: ormEntity.hasComputer,
      hasInternet: ormEntity.hasInternet,
      committedToParticipate: ormEntity.committedToParticipate,
      fullName: ormEntity.fullName,
      socialName: ormEntity.socialName,
    };
  }

  private mapToDomain(ormEntity: StudentOrmEntity): Student {
    const contact = new Contact(
      ormEntity.contact.id,
      ormEntity.contact.phone,
      ormEntity.contact.neighbourhood || undefined,
      ormEntity.contact.state || undefined,
      ormEntity.contact.city || undefined,
      ormEntity.contact.address || undefined,
      ormEntity.contact.cep || undefined,
      ormEntity.contact.complement || undefined,
    );

    const disability = ormEntity.disability
      ? new Disability(
          ormEntity.disability.studentId,
          ormEntity.disability.hasDisability,
          ormEntity.disability.type || undefined,
        )
      : undefined;

    const socialBenefits = ormEntity.socialBenefits.map(
      (benefit) =>
        new SocialBenefit(benefit.id, benefit.studentId, benefit.benefit),
    );

    return new Student(
      ormEntity.id,
      ormEntity.user.password,
      ormEntity.user.email,
      ormEntity.cpf,
      contact,
      this.coerceRequiredDate(ormEntity.birthDate),
      ormEntity.gender,
      ormEntity.race,
      ormEntity.fullName,
      ormEntity.education || undefined,
      ormEntity.institution || undefined,
      ormEntity.activityArea || undefined,
      ormEntity.hasProgrammingExperience ?? undefined,
      ormEntity.motivation || undefined,
      ormEntity.howHeard || undefined,
      ormEntity.hasComputer ?? undefined,
      ormEntity.hasInternet ?? undefined,
      ormEntity.committedToParticipate ?? undefined,
      disability,
      socialBenefits,
      ormEntity.socialName || undefined,
      ormEntity.courseName || undefined,
      ormEntity.familyIncome || undefined,
    );
  }

  private mapDisabilityToOrm(
    disability: Disability,
    student: StudentOrmEntity,
  ): DisabilityOrmEntity {
    const orm = new DisabilityOrmEntity();
    orm.studentId = disability.studentId;
    orm.hasDisability = disability.hasDisability;
    orm.type = disability.type || null;
    orm.student = student;
    return orm;
  }

  private mapSocialBenefitToOrm(
    benefit: SocialBenefit,
    studentId: string,
    student: StudentOrmEntity,
  ): SocialBenefitOrmEntity {
    const orm = new SocialBenefitOrmEntity();
    if (benefit.id > 0) {
      orm.id = benefit.id;
    }
    orm.studentId = studentId;
    orm.benefit = benefit.benefit;
    orm.student = student;
    return orm;
  }

  private coerceRequiredDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }
}
