import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

import {
  IStudentRepository,
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

    return ormEntities.map((entity) => this.mapToDomain(entity));
  }

  async findAllWithFilter(query: StudentFilterQuery): Promise<Student[]> {
    const queryBuilder = this.ormRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.contact', 'contact')
      .leftJoinAndSelect('student.disability', 'disability')
      .leftJoinAndSelect('student.socialBenefits', 'socialBenefits');

    if (query.cpf) {
      queryBuilder.andWhere('student.cpf ILIKE :cpf', {
        cpf: this.buildLikeFilter(query.cpf),
      });
    }

    if (query.text) {
      const text = this.buildLikeFilter(query.text);
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('student.socialName ILIKE :text', { text }).orWhere(
            'user.email ILIKE :text',
            { text },
          );
        }),
      );
    }

    if (query.courseType) {
      queryBuilder.andWhere('student.courseName ILIKE :courseType', {
        courseType: this.buildLikeFilter(query.courseType),
      });
    }

    if (query.location) {
      const location = this.buildLikeFilter(query.location);
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('contact.city ILIKE :location', { location })
            .orWhere('contact.state ILIKE :location', { location })
            .orWhere('contact.neighbourhood ILIKE :location', { location });
        }),
      );
    }

    const disabilityFilter =
      typeof query.disability === 'object' && query.disability !== null
        ? (query.disability as {
            hasDisability?: boolean;
            type?: string;
          })
        : undefined;

    if (disabilityFilter?.hasDisability !== undefined) {
      queryBuilder.andWhere('disability.hasDisability = :hasDisability', {
        hasDisability: disabilityFilter.hasDisability,
      });
    }

    if (disabilityFilter?.type) {
      queryBuilder.andWhere('disability.type ILIKE :disabilityType', {
        disabilityType: this.buildLikeFilter(disabilityFilter.type),
      });
    }

    const ormEntities = await queryBuilder.getMany();

    return ormEntities.map((entity) => this.mapToDomain(entity));
  }

  async findById(id: string): Promise<Student | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id },
      relations: ['user', 'contact', 'disability', 'socialBenefits'],
    });

    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async existsById(id: string): Promise<boolean> {
    return this.ormRepository.exists({ where: { id } });
  }

  async findByCpf(cpf: string): Promise<Student | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { cpf },
      relations: ['user', 'contact', 'disability', 'socialBenefits'],
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

  private mapToOrm(student: Student): StudentOrmEntity {
    const ormEntity = new StudentOrmEntity();

    ormEntity.id = student.id;
    ormEntity.cpf = student.cpf;
    ormEntity.birthDate = student.birthDate;
    ormEntity.gender = student.gender;
    ormEntity.race = student.race;
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
