import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IStudentRepository } from '../../../core/ports/student.repository.interface';
import { Student } from '../../../core/domain/student.entity';
import { Contact } from '../../../core/domain/contact.entity';
import { Disability } from '../../../core/domain/disability.entity';
import { SocialBenefit } from '../../../core/domain/social-benefit.entity';
import { AccessibilityResource } from '../../../core/domain/accessibility-resource.entity';

import { StudentOrmEntity } from '../orm/student.orm-entity';
import { UserOrmEntity } from '../orm/user.orm-entity';
import { ContactOrmEntity } from '../orm/contact.orm-entity';
import { DisabilityOrmEntity } from '../orm/disability.orm-entity';
import { SocialBenefitOrmEntity } from '../orm/social-benefit.orm-entity';
import { AccessibilityResourceOrmEntity } from '../orm/accessibility-resource.orm-entity';
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

        if (relatedRecords.accessibilityResources.length > 0) {
          await transactionalEntityManager.save(
            relatedRecords.accessibilityResources,
          );
        }
      },
    );

    const savedEntity = await this.ormRepository.findOne({
      where: { id: student.id },
      relations: [
        'user',
        'contact',
        'disability',
        'socialBenefits',
        'accessibilityResources',
      ],
    });

    return this.mapToDomain(savedEntity!);
  }

  async findAll(): Promise<Student[]> {
    const ormEntities = await this.ormRepository.find({
      relations: [
        'user',
        'contact',
        'disability',
        'socialBenefits',
        'accessibilityResources',
      ],
    });

    return ormEntities.map((entity) => this.mapToDomain(entity));
  }

  async findById(id: string): Promise<Student | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id },
      relations: [
        'user',
        'contact',
        'disability',
        'socialBenefits',
        'accessibilityResources',
      ],
    });

    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async existsById(id: string): Promise<boolean> {
    return this.ormRepository.exists({ where: { id } });
  }

  async findByCpf(cpf: string): Promise<Student | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { cpf },
      relations: [
        'user',
        'contact',
        'disability',
        'socialBenefits',
        'accessibilityResources',
      ],
    });

    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async update(student: Student): Promise<Student> {
    const ormEntity = this.mapToOrm(student);
    const relatedRecords = this.detachChildRelations(ormEntity);
    const shouldReplaceSocialBenefits =
      relatedRecords.socialBenefits.length === 0 ||
      relatedRecords.socialBenefits.some((benefit) => benefit.id == null);
    const shouldReplaceAccessibilityResources =
      relatedRecords.accessibilityResources.length === 0 ||
      relatedRecords.accessibilityResources.some(
        (resource) => resource.id == null,
      );

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

        if (shouldReplaceAccessibilityResources) {
          await transactionalEntityManager.delete(
            AccessibilityResourceOrmEntity,
            {
              studentId: ormEntity.id,
            },
          );
        }

        if (relatedRecords.accessibilityResources.length > 0) {
          await transactionalEntityManager.save(
            relatedRecords.accessibilityResources,
          );
        }
      },
    );

    const savedEntity = await this.ormRepository.findOne({
      where: { id: student.id },
      relations: [
        'user',
        'contact',
        'disability',
        'socialBenefits',
        'accessibilityResources',
      ],
    });

    return this.mapToDomain(savedEntity!);
  }

  async delete(id: string): Promise<void> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id },
      relations: [
        'user',
        'contact',
        'disability',
        'socialBenefits',
        'accessibilityResources',
      ],
    });

    if (ormEntity) {
      await this.ormRepository.manager.transaction(
        async (transactionalEntityManager) => {
          if (ormEntity.accessibilityResources?.length > 0) {
            await transactionalEntityManager.remove(
              ormEntity.accessibilityResources,
            );
          }
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
    ormEntity.institution = student.institution || null;
    ormEntity.activityArea = student.activityArea || null;
    ormEntity.hasProgrammingExperience =
      student.hasProgrammingExperience ?? null;
    ormEntity.hasTechnologyCourse = student.hasTechnologyCourse ?? null;
    ormEntity.sendCurriculum = student.sendCurriculum;
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

    ormEntity.accessibilityResources = student.accessibilityResources.map(
      (resource) =>
        this.mapAccessibilityResourceToOrm(resource, student.id, ormEntity),
    );

    return ormEntity;
  }

  private detachChildRelations(ormEntity: StudentOrmEntity): {
    disability: DisabilityOrmEntity | null;
    socialBenefits: SocialBenefitOrmEntity[];
    accessibilityResources: AccessibilityResourceOrmEntity[];
  } {
    const relatedRecords = {
      disability: ormEntity.disability,
      socialBenefits: ormEntity.socialBenefits,
      accessibilityResources: ormEntity.accessibilityResources,
    };

    ormEntity.disability = null;
    ormEntity.socialBenefits = [];
    ormEntity.accessibilityResources = [];

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
      institution: ormEntity.institution,
      activityArea: ormEntity.activityArea,
      hasProgrammingExperience: ormEntity.hasProgrammingExperience,
      hasTechnologyCourse: ormEntity.hasTechnologyCourse,
      sendCurriculum: ormEntity.sendCurriculum,
      motivation: ormEntity.motivation,
      howHeard: ormEntity.howHeard,
      hasComputer: ormEntity.hasComputer,
      hasInternet: ormEntity.hasInternet,
      committedToParticipate: ormEntity.committedToParticipate,
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
          ormEntity.disability.description || undefined,
          ormEntity.disability.hasReport || undefined,
          ormEntity.disability.type || undefined,
        )
      : undefined;

    const socialBenefits = ormEntity.socialBenefits.map(
      (benefit) => new SocialBenefit(benefit.id, benefit.studentId, benefit.benefit),
    );

    const accessibilityResources = ormEntity.accessibilityResources.map(
      (resource) =>
        new AccessibilityResource(
          resource.id,
          resource.studentId,
          resource.resource,
        ),
    );

    return new Student(
      ormEntity.id,
      ormEntity.user.password,
      ormEntity.user.email,
      ormEntity.cpf,
      contact,
      this.coerceOptionalDate(ormEntity.birthDate),
      ormEntity.gender || undefined,
      ormEntity.race || undefined,
      ormEntity.education || undefined,
      ormEntity.institution || undefined,
      ormEntity.activityArea || undefined,
      ormEntity.hasProgrammingExperience ?? undefined,
      ormEntity.hasTechnologyCourse ?? undefined,
      ormEntity.sendCurriculum ?? false,
      ormEntity.motivation || undefined,
      ormEntity.howHeard || undefined,
      ormEntity.hasComputer ?? undefined,
      ormEntity.hasInternet ?? undefined,
      ormEntity.committedToParticipate ?? undefined,
      disability,
      socialBenefits,
      accessibilityResources,
    );
  }

  private mapDisabilityToOrm(
    disability: Disability,
    student: StudentOrmEntity,
  ): DisabilityOrmEntity {
    const orm = new DisabilityOrmEntity();
    orm.studentId = disability.studentId;
    orm.hasDisability = disability.hasDisability;
    orm.description = disability.description || null;
    orm.hasReport = disability.hasReport || null;
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

  private mapAccessibilityResourceToOrm(
    resource: AccessibilityResource,
    studentId: string,
    student: StudentOrmEntity,
  ): AccessibilityResourceOrmEntity {
    const orm = new AccessibilityResourceOrmEntity();
    if (resource.id > 0) {
      orm.id = resource.id;
    }
    orm.studentId = studentId;
    orm.resource = resource.resource;
    orm.student = student;
    return orm;
  }

  private coerceOptionalDate(
    value: Date | string | null | undefined,
  ): Date | undefined {
    if (!value) {
      return undefined;
    }

    return value instanceof Date ? value : new Date(value);
  }
}
