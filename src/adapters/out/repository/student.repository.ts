import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';

import {
  IStudentRepository,
  PaginatedStudentListResult,
  StudentFilterQuery,
  StudentReportFilters,
  StudentReportProjection,
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
import { EnrollmentType } from '../../../core/domain/enrollment.entity';

type EnrollmentWithCourse = EnrollmentOrmEntity & {
  course?: CourseOrmEntity;
};

type StudentWithEnrollments = StudentOrmEntity & {
  enrollments?: EnrollmentWithCourse[];
};

interface StudentReportRawRow {
  student_id: string;
  email: string;
  cpf: string;
  full_name: string;
  social_name: string | null;
  phone_number: string | null;
  city: string | null;
  state: string | null;
  disability_has_disability: boolean | null;
  disability_type: string | null;
  course_id: string | null;
  course_name: string | null;
}

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

    if (query.city && query.city.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          query.city!.forEach((cityState, index) => {
            const [city, state] = cityState.split('/');
            const cityParam = `city_${index}`;
            const stateParam = `state_${index}`;

            const condition = state
              ? `(contact.city ILIKE :${cityParam} AND contact.state ILIKE :${stateParam})`
              : `contact.city ILIKE :${cityParam}`;

            if (index === 0) {
              qb.where(condition, {
                [cityParam]: this.buildLikeFilter(city.trim()),
                ...(state ? { [stateParam]: state.trim() } : {}),
              });
            } else {
              qb.orWhere(condition, {
                [cityParam]: this.buildLikeFilter(city.trim()),
                ...(state ? { [stateParam]: state.trim() } : {}),
              });
            }
          });
        }),
      );
    }

    if (query.disabilityType && query.disabilityType.length > 0) {
      queryBuilder.andWhere('disability.type IN (:...disabilityTypes)', {
        disabilityTypes: query.disabilityType,
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

  async findManyForReportByIds(
    ids: string[],
  ): Promise<StudentReportProjection[]> {
    if (ids.length === 0) {
      return [];
    }

    const queryBuilder = this.createStudentReportQueryBuilder();

    queryBuilder.andWhere('student.id IN (:...ids)', { ids });

    const rows = await queryBuilder.getRawMany<StudentReportRawRow>();
    const students = this.mapReportRows(rows);
    const orderById = new Map(ids.map((id, index) => [id, index]));

    return students.sort(
      (left, right) =>
        (orderById.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
        (orderById.get(right.id) ?? Number.MAX_SAFE_INTEGER),
    );
  }

  async findManyForReportByFilters(
    filters: StudentReportFilters = {},
  ): Promise<StudentReportProjection[]> {
    const queryBuilder = this.createStudentReportQueryBuilder();

    this.applyStudentReportFilters(queryBuilder, filters);

    const rows = await queryBuilder.getRawMany<StudentReportRawRow>();
    return this.mapReportRows(rows);
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

  async findByCpf(
    cpf: string,
    includeDeleted?: boolean,
  ): Promise<Student | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { cpf },
      relations: ['user', 'contact', 'disability', 'socialBenefits'],
      withDeleted: includeDeleted,
    });

    return ormEntity ? this.mapToDomain(ormEntity) : null;
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
    ormEntity.householdSize = student.householdSize ?? null;

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

  private createStudentReportQueryBuilder(): SelectQueryBuilder<StudentOrmEntity> {
    return this.ormRepository
      .createQueryBuilder('student')
      .innerJoin('student.user', 'user', 'user.deletedAt IS NULL')
      .leftJoin('student.contact', 'contact')
      .leftJoin('student.disability', 'disability')
      .leftJoin(
        EnrollmentOrmEntity,
        'reportEnrollment',
        'reportEnrollment.studentId = student.id AND reportEnrollment.type = :reportEnrollmentType',
        { reportEnrollmentType: EnrollmentType.ENROLLMENT },
      )
      .leftJoin(
        CourseOrmEntity,
        'reportCourse',
        'reportCourse.id = reportEnrollment.courseId',
      )
      .select('student.id', 'student_id')
      .addSelect('user.email', 'email')
      .addSelect('student.cpf', 'cpf')
      .addSelect('student.fullName', 'full_name')
      .addSelect('student.socialName', 'social_name')
      .addSelect('contact.phone', 'phone_number')
      .addSelect('contact.city', 'city')
      .addSelect('contact.state', 'state')
      .addSelect('disability.hasDisability', 'disability_has_disability')
      .addSelect('disability.type', 'disability_type')
      .addSelect('reportCourse.id', 'course_id')
      .addSelect('reportCourse.name', 'course_name')
      .orderBy('student.fullName', 'ASC')
      .addOrderBy('reportEnrollment.createdAt', 'DESC', 'NULLS LAST');
  }

  private applyStudentReportFilters(
    queryBuilder: SelectQueryBuilder<StudentOrmEntity>,
    filters: StudentReportFilters,
  ): void {
    if (filters.search) {
      const search = this.buildLikeFilter(filters.search);
      const normalizedCpf = this.normalizeCpf(filters.search);

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

    if (filters.course) {
      if (this.isUuid(filters.course)) {
        queryBuilder.andWhere('reportCourse.id = :courseId', {
          courseId: filters.course,
        });
      } else {
        queryBuilder.andWhere('reportCourse.name ILIKE :course', {
          course: this.buildLikeFilter(filters.course),
        });
      }
    }

    if (filters.location) {
      this.applyLocationFilter(queryBuilder, filters.location);
    }

    if (filters.pcdType) {
      queryBuilder
        .andWhere('disability.hasDisability = :hasDisability', {
          hasDisability: true,
        })
        .andWhere('LOWER(disability.type) IN (:...pcdTypes)', {
          pcdTypes: this.expandPcdTypeFilter(filters.pcdType),
        });
    }

    if (filters.status === 'ENROLLMENT' || filters.status === 'INTEREST') {
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1
          FROM "enrollments" "statusEnrollment"
          WHERE "statusEnrollment"."student_id" = student.id
            AND "statusEnrollment"."type" = :statusType
        )`,
        { statusType: filters.status },
      );
    }

    if (filters.status === 'NAO_INSCRITO') {
      queryBuilder.andWhere(
        `NOT EXISTS (
          SELECT 1
          FROM "enrollments" "statusEnrollment"
          WHERE "statusEnrollment"."student_id" = student.id
        )`,
      );
    }
  }

  private applyLocationFilter(
    queryBuilder: SelectQueryBuilder<StudentOrmEntity>,
    location: string,
  ): void {
    const [city, state] = location.split('/').map((value) => value.trim());

    if (city && state) {
      queryBuilder.andWhere(
        'contact.city ILIKE :locationCity AND contact.state ILIKE :locationState',
        {
          locationCity: this.buildLikeFilter(city),
          locationState: state,
        },
      );
      return;
    }

    queryBuilder.andWhere(
      new Brackets((qb) => {
        qb.where('contact.city ILIKE :location', {
          location: this.buildLikeFilter(location),
        })
          .orWhere('contact.state ILIKE :location', {
            location: this.buildLikeFilter(location),
          })
          .orWhere('contact.address ILIKE :location', {
            location: this.buildLikeFilter(location),
          });
      }),
    );
  }

  private mapReportRows(
    rows: StudentReportRawRow[],
  ): StudentReportProjection[] {
    const studentsById = new Map<string, StudentReportProjection>();
    const courseIdsByStudentId = new Map<string, Set<string>>();

    for (const row of rows) {
      let student = studentsById.get(row.student_id);

      if (!student) {
        student = {
          id: row.student_id,
          email: row.email,
          cpf: row.cpf,
          fullName: row.full_name,
          socialName: row.social_name || undefined,
          phoneNumber: row.phone_number ?? '',
          city: row.city || undefined,
          state: row.state || undefined,
          courseNames: [],
          hasDisability: row.disability_has_disability ?? undefined,
          disabilityType: row.disability_type || undefined,
        };
        studentsById.set(row.student_id, student);
        courseIdsByStudentId.set(row.student_id, new Set<string>());
      }

      if (row.course_id && row.course_name) {
        const courseIds = courseIdsByStudentId.get(row.student_id)!;

        if (!courseIds.has(row.course_id)) {
          courseIds.add(row.course_id);
          student.courseNames.push(row.course_name);
        }
      }
    }

    return Array.from(studentsById.values());
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private expandPcdTypeFilter(value: string): string[] {
    const normalized = this.normalizeKey(value);
    const aliases: Record<string, string[]> = {
      fisica: ['fisica', 'fisico', 'f\u00edsica', 'f\u00edsico'],
      fisico: ['fisica', 'fisico', 'f\u00edsica', 'f\u00edsico'],
      visual: ['visual', 'ocular'],
      ocular: ['visual', 'ocular'],
      auditiva: ['auditiva', 'auditivo'],
      auditivo: ['auditiva', 'auditivo'],
      intelectual: ['intelectual'],
      psicossocial: ['psicossocial'],
      multipla: ['multipla', 'multiplo', 'm\u00faltipla', 'm\u00faltiplo'],
      multiplo: ['multipla', 'multiplo', 'm\u00faltipla', 'm\u00faltiplo'],
      tea: ['tea'],
      outra: ['outra', 'outro'],
      outro: ['outra', 'outro'],
    };

    return Array.from(
      new Set([
        ...(aliases[normalized] ?? []),
        value.trim().toLowerCase(),
        normalized,
      ]),
    );
  }

  private normalizeKey(value: string): string {
    return value
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }

  private mapToListProjection(ormEntity: StudentWithEnrollments) {
    return {
      id: ormEntity.id,
      email: ormEntity.user.email,
      cpf: ormEntity.cpf,
      fullName: ormEntity.fullName,
      socialName: ormEntity.socialName || undefined,
      phoneNumber: ormEntity.contact.phone,
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
      householdSize: ormEntity.householdSize,
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
      ormEntity.householdSize || undefined,
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
