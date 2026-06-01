import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  EntityManager,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { randomUUID } from 'crypto';

import {
  StudentCityCount,
  DisabilityCount,
  IStudentRepository,
  PaginatedStudentListResult,
  StudentFilterQuery,
  StudentReportFilters,
  StudentReportProjection,
  StudentWithCurriculumAvailability,
} from '../../../core/ports/student.repository.interface';
import { Student } from '../../../core/domain/student.entity';
import { Contact } from '../../../core/domain/contact.entity';
import { StudentOrmEntity } from '../orm/student.orm-entity';
import { TelephoneStudentOrmEntity } from '../orm/telephone-student.orm-entity';
import { AddressStudentOrmEntity } from '../orm/address-student.orm-entity';
import { UserOrmEntity } from '../orm/user.orm-entity';
import { DisabilityOrmEntity } from '../orm/disability.orm-entity';
import { SocialBenefitOrmEntity } from '../orm/social-benefit.orm-entity';
import { UserRoleEnum } from '../../../core/domain/enums/user-role.enum';
import { EnrollmentOrmEntity } from '../orm/enrollment.orm-entity';
import { CourseOrmEntity } from '../orm/course.orm-entity';
import { CurriculumOrmEntity } from '../orm/curriculum.orm-entity';
import { EnrollmentType } from '../../../core/domain/enrollment.entity';

type EnrollmentWithCourse = EnrollmentOrmEntity & {
  course?: CourseOrmEntity;
};

type StudentWithEnrollments = StudentOrmEntity & {
  enrollments?: EnrollmentWithCourse[];
  curriculum?: CurriculumOrmEntity;
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

    await this.ormRepository.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.save(ormEntity.user);
        await transactionalEntityManager.save(ormEntity);

        await this.syncDisabilities(
          transactionalEntityManager,
          ormEntity.id,
          student.disabilities ?? [],
        );

        await this.syncSocialBenefits(
          transactionalEntityManager,
          ormEntity.id,
          student.socialBenefitNames ?? [],
        );
      },
    );

    const savedEntity = await this.ormRepository.findOne({
      where: { id: student.id },
      relations: [
        'user',
        'telephone',
        'address',
        'disabilities',
        'socialBenefits',
      ],
    });

    return this.mapToDomain(savedEntity!);
  }

  async findAll(): Promise<StudentWithCurriculumAvailability[]> {
    const ormEntities = await this.ormRepository
      .createQueryBuilder('student')
      .innerJoinAndSelect('student.user', 'user', 'user.deletedAt IS NULL')
      .leftJoinAndSelect('student.telephone', 'telephone')
      .leftJoinAndSelect('student.address', 'address')
      .leftJoinAndSelect('student.disabilities', 'disabilities')
      .leftJoinAndSelect('student.socialBenefits', 'socialBenefits')
      .leftJoinAndMapOne(
        'student.curriculum',
        CurriculumOrmEntity,
        'curriculum',
        'curriculum.student_id = student.id',
      )
      .getMany();

    return ormEntities.map((entity) => {
      const withCurriculum = entity as StudentOrmEntity & {
        curriculum?: CurriculumOrmEntity;
      };
      return {
        student: this.mapToDomain(entity),
        curriculumIsAvailable: withCurriculum.curriculum?.isAvailable ?? false,
      };
    });
  }

  async findAllWithFilter(
    query: StudentFilterQuery,
  ): Promise<PaginatedStudentListResult> {
    const queryBuilder = this.ormRepository
      .createQueryBuilder('student')
      .innerJoinAndSelect('student.user', 'user', 'user.deletedAt IS NULL')
      .leftJoinAndSelect('student.telephone', 'telephone')
      .leftJoinAndSelect('student.address', 'address')
      .leftJoinAndSelect('student.disabilities', 'disabilities')
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
      )
      .leftJoinAndMapOne(
        'student.curriculum',
        CurriculumOrmEntity,
        'curriculum',
        'curriculum.student_id = student.id',
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
      if (query.modality === 'NAO_INSCRITO') {
        queryBuilder.andWhere('enrollment.id IS NULL');
      } else {
        queryBuilder.andWhere('course.modality = :modality', {
          modality: query.modality,
        });
      }
    }

    if (query.city && query.city.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          query.city!.forEach((location, index) => {
            const [city, state] = location
              .split('/')
              .map((value) => value.trim());
            if (city && state) {
              qb.orWhere(
                `(address.city ILIKE :city${index} AND address.state ILIKE :state${index})`,
                {
                  [`city${index}`]: this.buildLikeFilter(city),
                  [`state${index}`]: state,
                },
              );
            } else {
              qb.orWhere(`address.city ILIKE :loc${index}`, {
                [`loc${index}`]: this.buildLikeFilter(location),
              });
            }
          });
        }),
      );
    }

    if (query.disabilityType && query.disabilityType.length > 0) {
      queryBuilder.andWhere('disabilities.name IN (:...disabilityTypes)', {
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
      relations: [
        'user',
        'telephone',
        'address',
        'disabilities',
        'socialBenefits',
      ],
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
      relations: [
        'user',
        'telephone',
        'address',
        'disabilities',
        'socialBenefits',
      ],
      withDeleted: includeDeleted,
    });

    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async update(student: Student): Promise<Student> {
    const ormEntity = this.mapToOrm(student);

    await this.ormRepository.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.save(ormEntity.user);
        await transactionalEntityManager.update(
          StudentOrmEntity,
          { id: ormEntity.id },
          this.mapStudentFieldsToUpdate(ormEntity),
        );

        await this.syncDisabilities(
          transactionalEntityManager,
          ormEntity.id,
          student.disabilities ?? [],
        );

        await this.syncSocialBenefits(
          transactionalEntityManager,
          ormEntity.id,
          student.socialBenefitNames ?? [],
        );

        if (ormEntity.telephone) {
          await transactionalEntityManager.save(ormEntity.telephone);
        }
        if (ormEntity.address) {
          await transactionalEntityManager.save(ormEntity.address);
        }
      },
    );

    const savedEntity = await this.ormRepository.findOne({
      where: { id: student.id },
      relations: [
        'user',
        'telephone',
        'address',
        'disabilities',
        'socialBenefits',
      ],
    });

    return this.mapToDomain(savedEntity!);
  }

  async delete(id: string): Promise<void> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id },
      relations: [
        'user',
        'telephone',
        'address',
        'disabilities',
        'socialBenefits',
      ],
    });

    if (ormEntity) {
      await this.ormRepository.manager.transaction(
        async (transactionalEntityManager) => {
          await transactionalEntityManager
            .createQueryBuilder()
            .delete()
            .from('student_disability')
            .where('student_id = :id', { id })
            .execute();

          await transactionalEntityManager
            .createQueryBuilder()
            .delete()
            .from('student_social_benefit')
            .where('student_id = :id', { id })
            .execute();

          await transactionalEntityManager.remove(ormEntity);

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

  private async syncDisabilities(
    manager: EntityManager,
    studentId: string,
    disabilityNames: string[],
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .delete()
      .from('student_disability')
      .where('student_id = :studentId', { studentId })
      .execute();

    if (disabilityNames.length > 0) {
      const upperNames = disabilityNames.map((n) =>
        n
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase(),
      );
      const disabilities = await manager
        .getRepository(DisabilityOrmEntity)
        .findBy({ name: In(upperNames) });

      const existingNames = disabilities.map(
        (d: DisabilityOrmEntity) => d.name,
      );
      const missingNames = upperNames.filter(
        (name) => !existingNames.includes(name),
      );

      for (const missing of missingNames) {
        const newDisability = manager
          .getRepository(DisabilityOrmEntity)
          .create({
            id: randomUUID(),
            name: missing,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        await manager.getRepository(DisabilityOrmEntity).save(newDisability);
        disabilities.push(newDisability);
      }

      for (const disability of disabilities) {
        await manager
          .createQueryBuilder()
          .insert()
          .into('student_disability')
          .values({ student_id: studentId, disability_id: disability.id })
          .execute();
      }
    }
  }

  private async syncSocialBenefits(
    manager: EntityManager,
    studentId: string,
    benefitNames: string[],
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .delete()
      .from('student_social_benefit')
      .where('student_id = :studentId', { studentId })
      .execute();

    if (benefitNames.length > 0) {
      const upperNames = benefitNames.map((n) =>
        n
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase(),
      );
      const benefits = await manager
        .getRepository(SocialBenefitOrmEntity)
        .findBy({ name: In(upperNames) });

      const existingNames = benefits.map((b: SocialBenefitOrmEntity) => b.name);
      const missingNames = upperNames.filter(
        (name) => !existingNames.includes(name),
      );

      for (const missing of missingNames) {
        const newBenefit = manager
          .getRepository(SocialBenefitOrmEntity)
          .create({
            id: randomUUID(),
            name: missing,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        await manager.getRepository(SocialBenefitOrmEntity).save(newBenefit);
        benefits.push(newBenefit);
      }

      for (const benefit of benefits) {
        await manager
          .createQueryBuilder()
          .insert()
          .into('student_social_benefit')
          .values({ student_id: studentId, social_benefit_id: benefit.id })
          .execute();
      }
    }
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
    ormEntity.socialName = student.socialName || null;

    ormEntity.user = new UserOrmEntity();
    ormEntity.user.id = student.id;
    ormEntity.user.email = student.email;
    ormEntity.user.password = student.password;
    ormEntity.user.role = UserRoleEnum.STUDENT;

    ormEntity.telephone = new TelephoneStudentOrmEntity();
    ormEntity.telephone.id = student.id;
    ormEntity.telephone.studentId = student.id;
    ormEntity.telephone.phone = student.contact.phone;

    ormEntity.address = new AddressStudentOrmEntity();
    ormEntity.address.id = student.id;
    ormEntity.address.studentId = student.id;
    ormEntity.address.neighbourhood = student.contact.neighbourhood || null;
    ormEntity.address.state = student.contact.state || null;
    ormEntity.address.city = student.contact.city || null;
    ormEntity.address.address = student.contact.address || null;
    ormEntity.address.cep = student.contact.cep!;
    ormEntity.address.complement = student.contact.complement || null;

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
      .leftJoin('student.telephone', 'telephone')
      .leftJoin('student.address', 'address')
      .leftJoin('student.disabilities', 'disabilities')
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
      .addSelect('telephone.phone', 'phone_number')
      .addSelect('address.city', 'city')
      .addSelect('address.state', 'state')
      .addSelect('disabilities.name', 'disability_type')
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
        .andWhere('disabilities.id IS NOT NULL')
        .andWhere('LOWER(disabilities.name) IN (:...pcdTypes)', {
          pcdTypes: this.expandPcdTypeFilter(filters.pcdType),
        });
    }

    if (filters.status === 'INSCRICAO' || filters.status === 'INTERESSE') {
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
        'address.city ILIKE :locationCity AND address.state ILIKE :locationState',
        {
          locationCity: this.buildLikeFilter(city),
          locationState: state,
        },
      );
      return;
    }

    queryBuilder.andWhere(
      new Brackets((qb) => {
        qb.where('address.city ILIKE :location', {
          location: this.buildLikeFilter(location),
        })
          .orWhere('address.state ILIKE :location', {
            location: this.buildLikeFilter(location),
          })
          .orWhere('address.address ILIKE :location', {
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
          hasDisability: row.disability_type ? true : false,
          disabilityType: row.disability_type || undefined,
        };
        studentsById.set(row.student_id, student);
        courseIdsByStudentId.set(row.student_id, new Set<string>());
      } else {
        if (row.disability_type) {
          student.hasDisability = true;
          if (!student.disabilityType) {
            student.disabilityType = row.disability_type;
          } else if (!student.disabilityType.includes(row.disability_type)) {
            student.disabilityType += `, ${row.disability_type}`;
          }
        }
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
      phoneNumber: ormEntity.telephone?.phone || '',
      city: ormEntity.address?.city || undefined,
      state: ormEntity.address?.state || undefined,
      hasDisability: (ormEntity.disabilities?.length ?? 0) > 0,
      disabilityType:
        ormEntity.disabilities?.map((d) => d.name).join(', ') || undefined,
      enrollments: (ormEntity.enrollments ?? []).map((enrollment) => ({
        courseId: enrollment.courseId,
        courseModality: enrollment.course?.modality ?? 'ONLINE',
      })),
      curriculumIsAvailable: ormEntity.curriculum?.isAvailable ?? false,
    };
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
      ormEntity.telephone.id,
      ormEntity.telephone.phone,
      ormEntity.address.neighbourhood || undefined,
      ormEntity.address.state || undefined,
      ormEntity.address.city || undefined,
      ormEntity.address.address || undefined,
      ormEntity.address.cep,
      ormEntity.address.complement || undefined,
    );

    const disabilities = ormEntity.disabilities?.map((d) => d.name) || [];
    const socialBenefitNames =
      ormEntity.socialBenefits?.map((b) => b.name) || [];

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
      ormEntity.socialName || undefined,
      ormEntity.courseName || undefined,
      ormEntity.familyIncome || undefined,
      ormEntity.householdSize || undefined,
      disabilities,
      socialBenefitNames,
    );
  }

  async findLocations(): Promise<{ city: string; uf: string }[]> {
    const rawData = await this.ormRepository
      .createQueryBuilder('student')
      .innerJoin('student.address', 'address')
      .select('address.city', 'city')
      .addSelect('address.state', 'uf')
      .where('address.city IS NOT NULL')
      .andWhere('address.state IS NOT NULL')
      .distinct(true)
      .getRawMany();

    return rawData as { city: string; uf: string }[];
  }

  private coerceRequiredDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }

  async countByDisabilityType(): Promise<DisabilityCount[]> {
    const rows = await this.ormRepository
      .createQueryBuilder('student')
      .innerJoin('student.disabilities', 'disability')
      .select('disability.name', 'disabilityType')
      .addSelect('CAST(COUNT(*) AS int)', 'count')
      .groupBy('disability.name')
      .orderBy('count', 'DESC')
      .getRawMany<{ disabilityType: string; count: number }>();

    return rows;
  }

  async countByCity(): Promise<StudentCityCount[]> {
    const rows = await this.ormRepository
      .createQueryBuilder('student')
      .innerJoin('student.address', 'address')
      .select('address.city', 'cityName')
      .addSelect('address.state', 'uf')
      .addSelect('CAST(COUNT(student.id) AS int)', 'studentsCount')
      .where('address.city IS NOT NULL')
      .andWhere('address.state IS NOT NULL')
      .groupBy('address.city')
      .addGroupBy('address.state')
      .orderBy('"studentsCount"', 'DESC')
      .getRawMany<StudentCityCount>();

    return rows;
  }
  async countTotal(): Promise<number> {
    return this.ormRepository.count();
  }

  async countPCD(): Promise<number> {
    return this.ormRepository
      .createQueryBuilder('student')
      .innerJoin('student.disabilities', 'disability')
      .select('student.id')
      .distinct(true)
      .getCount();
  }

  async countByMonth(): Promise<{ month: string; count: number }[]> {
    const rows = await this.ormRepository
      .createQueryBuilder('student')
      .innerJoin('student.user', 'user')
      .select("TO_CHAR(user.createdAt, 'YYYY-MM')", 'month')
      .addSelect('CAST(COUNT(student.id) AS int)', 'count')
      .groupBy("TO_CHAR(user.createdAt, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany<{ month: string; count: number }>();

    return rows;
  }
}
