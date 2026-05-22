import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import {
  Curriculum,
  CurriculumSkill,
} from '../../../core/domain/curriculum.entity';
import { ICurriculumRepository } from '../../../core/ports/curriculum.repository.interface';
import { CurriculumSkillOrmEntity } from '../orm/curriculum-skill.orm-entity';
import { CurriculumOrmEntity } from '../orm/curriculum.orm-entity';
import { SkillOrmEntity } from '../orm/skill.orm-entity';
import { StudentOrmEntity } from '../orm/student.orm-entity';

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
