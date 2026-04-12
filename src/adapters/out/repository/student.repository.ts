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
        await transactionalEntityManager.save(ormEntity.contact);

        await transactionalEntityManager.save(ormEntity);

        if (ormEntity.disability) {
          await transactionalEntityManager.save(ormEntity.disability);
        }

        if (ormEntity.socialBenefits.length > 0) {
          await transactionalEntityManager.save(ormEntity.socialBenefits);
        }

        if (ormEntity.accessibilityResources.length > 0) {
          await transactionalEntityManager.save(
            ormEntity.accessibilityResources,
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

    await this.ormRepository.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.save(ormEntity.user);
        await transactionalEntityManager.save(ormEntity.contact);
        await transactionalEntityManager.save(ormEntity);

        if (ormEntity.disability) {
          await transactionalEntityManager.save(ormEntity.disability);
        }

        if (ormEntity.socialBenefits.length > 0) {
          await transactionalEntityManager.save(ormEntity.socialBenefits);
        }

        if (ormEntity.accessibilityResources.length > 0) {
          await transactionalEntityManager.save(
            ormEntity.accessibilityResources,
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
    ormEntity.socialName = student.socialName || null;
    ormEntity.birthDate = student.birthDate || null;
    ormEntity.gender = student.gender || null;
    ormEntity.race = student.race || null;
    ormEntity.education = student.education || null;
    ormEntity.courseName = student.courseName || null;
    ormEntity.institution = student.institution || null;
    ormEntity.activityArea = student.activityArea || null;
    ormEntity.hasProgrammingExperience =
      student.hasProgrammingExperience ?? null;
    ormEntity.hasTechCourses = student.hasTechCourses ?? null;
    ormEntity.techCoursesList = student.techCoursesList || null;
    ormEntity.sendCurriculum = student.sendCurriculum;
    ormEntity.fatilabMotivation = student.fatilabMotivation || null;
    ormEntity.howHeard = student.howHeard || null;
    ormEntity.hasComputer = student.hasComputer ?? null;
    ormEntity.hasInternet = student.hasInternet ?? null;
    ormEntity.committedToParticipate = student.committedToParticipate ?? null;

    ormEntity.user = new UserOrmEntity();
    ormEntity.user.id = student.id;
    ormEntity.user.email = student.email;
    ormEntity.user.password = student.password;

    ormEntity.contact = new ContactOrmEntity();
    ormEntity.contact.id = student.contact.id;
    ormEntity.contact.user = ormEntity.user;
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
      (benefit) =>
        new SocialBenefit(
          benefit.id,
          benefit.studentId,
          benefit.benefit,
          benefit.benefitOther || undefined,
        ),
    );

    const accessibilityResources = ormEntity.accessibilityResources.map(
      (resource) =>
        new AccessibilityResource(
          resource.id,
          resource.studentId,
          resource.resource,
          resource.resourceOther || undefined,
        ),
    );

    return new Student(
      ormEntity.id,
      ormEntity.user.password,
      ormEntity.user.email,
      ormEntity.cpf,
      contact,
      ormEntity.socialName || undefined,
      ormEntity.birthDate || undefined,
      ormEntity.gender || undefined,
      ormEntity.race || undefined,
      ormEntity.education || undefined,
      ormEntity.courseName || undefined,
      ormEntity.institution || undefined,
      ormEntity.activityArea || undefined,
      ormEntity.hasProgrammingExperience ?? undefined,
      ormEntity.hasTechCourses ?? undefined,
      ormEntity.techCoursesList || undefined,
      ormEntity.sendCurriculum ?? false,
      ormEntity.fatilabMotivation || undefined,
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
    orm.id = benefit.id;
    orm.studentId = studentId;
    orm.benefit = benefit.benefit;
    orm.benefitOther = benefit.benefitOther || null;
    orm.student = student;
    return orm;
  }

  private mapAccessibilityResourceToOrm(
    resource: AccessibilityResource,
    studentId: string,
    student: StudentOrmEntity,
  ): AccessibilityResourceOrmEntity {
    const orm = new AccessibilityResourceOrmEntity();
    orm.id = resource.id;
    orm.studentId = studentId;
    orm.resource = resource.resource;
    orm.resourceOther = resource.resourceOther || null;
    orm.student = student;
    return orm;
  }
}
