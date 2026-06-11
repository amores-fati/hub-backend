import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import {
  Curriculum,
  CurriculumSkill,
} from '../../../core/domain/curriculum.entity';
import {
  ICurriculumRepository,
  ResumeFilterQuery,
  ResumeListProjection,
  PaginatedResumeListResult,
} from '../../../core/ports/curriculum.repository.interface';
import { CurriculumSkillOrmEntity } from '../orm/curriculum-skill.orm-entity';
import { CurriculumOrmEntity } from '../orm/curriculum.orm-entity';
import { SkillOrmEntity } from '../orm/skill.orm-entity';
import { AddressStudentOrmEntity } from '../orm/address-student.orm-entity';
import { StudentOrmEntity } from '../orm/student.orm-entity';
import { TelephoneStudentOrmEntity } from '../orm/telephone-student.orm-entity';
import { UserOrmEntity } from '../orm/user.orm-entity';

type CurriculumWithStudent = CurriculumOrmEntity & {
  student: StudentOrmEntity & {
    user: UserOrmEntity;
    phone: TelephoneStudentOrmEntity | null;
    address: AddressStudentOrmEntity | null;
  };
};

@Injectable()
export class CurriculumRepository implements ICurriculumRepository {
  constructor(
    @InjectRepository(CurriculumOrmEntity)
    private readonly ormRepository: Repository<CurriculumOrmEntity>,
  ) {}

  async findByStudentId(studentId: string): Promise<Curriculum | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { student: { id: studentId } },
      relations: ['curriculumSkills', 'curriculumSkills.skill'],
    });

    return ormEntity ? this.mapToDomain(ormEntity, studentId) : null;
  }

  async findAllWithFilter(
    query: ResumeFilterQuery,
  ): Promise<PaginatedResumeListResult> {
    const normalizedPage = Math.max(1, query.page);
    const normalizedLimit = Math.max(1, Math.min(50, query.limit));

    const queryBuilder = this.ormRepository
      .createQueryBuilder('curriculum')
      .innerJoinAndSelect('curriculum.student', 'student')
      .innerJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.telephone', 'phone')
      .leftJoinAndSelect('student.address', 'address')
      .leftJoin('student.disabilities', 'disability');

    if (query.search) {
      const search = this.buildLikeFilter(query.search);
      const normalizedCpf = this.normalizeCpf(query.search);

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('student.fullName ILIKE :search', { search })
            .orWhere('student.socialName ILIKE :search', { search })
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

    if (query.activityArea && query.activityArea.length > 0) {
      queryBuilder.andWhere(
        'LOWER(student.activityArea) IN (:...activityAreas)',
        {
          activityAreas: query.activityArea.map((area) => area.toLowerCase()),
        },
      );
    }

    if (query.preference) {
      queryBuilder.andWhere('curriculum.preference ILIKE :preference', {
        preference: this.buildLikeFilter(query.preference),
      });
    }

    if (query.status) {
      const statusLower = query.status.toLowerCase();
      if (statusLower === 'available') {
        queryBuilder.andWhere('curriculum.isAvailable = :isAvailable', {
          isAvailable: true,
        });
      } else if (statusLower === 'unavailable') {
        queryBuilder.andWhere('curriculum.isAvailable = :isAvailable', {
          isAvailable: false,
        });
      }
    }

    if (query.city && query.city.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          query.city!.forEach((location, index) => {
            const [city, state] = location.split('/').map((v) => v.trim());
            if (city && state) {
              qb.orWhere(
                `(address.city ILIKE :city${index} AND address.state ILIKE :state${index})`,
                {
                  [`city${index}`]: `%${city}%`,
                  [`state${index}`]: state,
                },
              );
            } else {
              qb.orWhere(`address.city ILIKE :loc${index}`, {
                [`loc${index}`]: `%${location}%`,
              });
            }
          });
        }),
      );
    }

    if (query.isPcd !== undefined) {
      if (query.isPcd) {
        queryBuilder.andWhere('disability.id IS NOT NULL');
      } else {
        queryBuilder.andWhere('disability.id IS NULL');
      }
    }

    const [ormEntities, total] = await queryBuilder
      .skip((normalizedPage - 1) * normalizedLimit)
      .take(normalizedLimit)
      .getManyAndCount();

    return {
      items: ormEntities.map((entity) =>
        this.mapToListProjection(entity as CurriculumWithStudent),
      ),
      total,
    };
  }

  async save(curriculum: Curriculum): Promise<Curriculum> {
    await this.ormRepository.save(this.mapToOrm(curriculum));
    const saved = await this.findByStudentId(curriculum.studentId);

    return saved!;
  }

  async findOrCreateSkillByName(skillName: string): Promise<CurriculumSkill> {
    const normalizedSkillName = skillName.trim();
    const skillRepository =
      this.ormRepository.manager.getRepository(SkillOrmEntity);

    const existingSkill = await skillRepository
      .createQueryBuilder('skill')
      .where('LOWER(skill.name) = LOWER(:skillName)', {
        skillName: normalizedSkillName,
      })
      .getOne();

    if (existingSkill) {
      return this.mapSkillToDomain(existingSkill);
    }

    const skill = skillRepository.create({
      id: randomUUID(),
      name: normalizedSkillName,
    });

    const savedSkill = await skillRepository.save(skill);

    return this.mapSkillToDomain(savedSkill);
  }

  async addSkillToCurriculum(
    curriculumId: string,
    skillId: string,
  ): Promise<void> {
    const curriculumSkillRepository = this.ormRepository.manager.getRepository(
      CurriculumSkillOrmEntity,
    );
    const curriculumSkill = curriculumSkillRepository.create({
      curriculumId,
      skillId,
    });

    await curriculumSkillRepository.save(curriculumSkill);
  }

  async removeSkillFromCurriculum(
    curriculumId: string,
    skillId: string,
  ): Promise<void> {
    await this.ormRepository.manager
      .getRepository(CurriculumSkillOrmEntity)
      .delete({
        curriculumId,
        skillId,
      });
  }

  private buildLikeFilter(value: string): string {
    return `%${value}%`;
  }

  private normalizeCpf(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  private mapToListProjection(
    ormEntity: CurriculumWithStudent,
  ): ResumeListProjection {
    return {
      id: ormEntity.id,
      studentId: ormEntity.student.id,
      cpf: this.formatCpf(ormEntity.student.cpf),
      fullName: ormEntity.student.fullName,
      socialName: ormEntity.student.socialName || undefined,
      email: ormEntity.student.user.email,
      isAvailable: ormEntity.isAvailable,
      about: ormEntity.about || undefined,
      linkedin: ormEntity.linkedin || undefined,
      github: ormEntity.github || undefined,
      preference: ormEntity.preference || undefined,
      phone: ormEntity.student.telephone?.phone || undefined,
    };
  }

  private formatCpf(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  private mapToOrm(curriculum: Curriculum): CurriculumOrmEntity {
    const ormEntity = new CurriculumOrmEntity();

    ormEntity.id = curriculum.id;
    ormEntity.student = { id: curriculum.studentId } as StudentOrmEntity;
    ormEntity.isAvailable = true;
    ormEntity.about = curriculum.about;
    ormEntity.linkedin = curriculum.linkedinUrl;
    ormEntity.github = curriculum.githubUrl;
    ormEntity.videoPresentation = curriculum.videoPresentationUrl;
    ormEntity.profilePhoto = curriculum.photoUrl;
    ormEntity.profilePhotoImage = curriculum.photoBuffer;
    ormEntity.profilePhotoMimeType = curriculum.photoMimeType;

    return ormEntity;
  }

  private mapToDomain(
    ormEntity: CurriculumOrmEntity,
    fallbackStudentId?: string,
  ): Curriculum {
    return new Curriculum(
      ormEntity.id,
      ormEntity.student?.id ?? fallbackStudentId!,
      ormEntity.about,
      ormEntity.linkedin,
      ormEntity.github,
      ormEntity.videoPresentation,
      ormEntity.profilePhoto,
      ormEntity.profilePhotoImage,
      ormEntity.profilePhotoMimeType,
      (ormEntity.curriculumSkills ?? []).map((curriculumSkill) => ({
        id: curriculumSkill.skill.id,
        skillName: curriculumSkill.skill.name,
      })),
    );
  }

  private mapSkillToDomain(skill: SkillOrmEntity): CurriculumSkill {
    return {
      id: skill.id,
      skillName: skill.name,
    };
  }
}
