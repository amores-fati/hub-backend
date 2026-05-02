import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICurriculumRepository } from '../../../core/ports/curriculum.repository.interface';
import { Curriculum } from '../../../core/domain/curriculum.entity';
import { Skill } from '../../../core/domain/skill.entity';
import { Student } from '../../../core/domain/student.entity';
import { Contact } from '../../../core/domain/contact.entity';
import { CurriculumOrmEntity } from '../orm/curriculum.orm-entity';
import { CurriculumSkillOrmEntity } from '../orm/curriculum-skill.orm-entity';

@Injectable()
export class CurriculumRepository implements ICurriculumRepository {
  constructor(
    @InjectRepository(CurriculumOrmEntity)
    private readonly curriculumRepo: Repository<CurriculumOrmEntity>,
    @InjectRepository(CurriculumSkillOrmEntity)
    private readonly curriculumSkillRepo: Repository<CurriculumSkillOrmEntity>,
  ) {}

  async findActiveResumeByStudentId(
    studentId: string,
  ): Promise<Curriculum | null> {
    const curriculum = await this.curriculumRepo
      .createQueryBuilder('curriculum')
      .innerJoinAndSelect('curriculum.student', 'student')
      .innerJoinAndSelect('student.user', 'user')
      .innerJoinAndSelect('student.contact', 'contact')
      .where('student.id = :studentId', { studentId })
      .andWhere('user.deletedAt IS NULL')
      .getOne();

    if (!curriculum) return null;

    const curriculumSkills = await this.curriculumSkillRepo
      .createQueryBuilder('cs')
      .innerJoinAndSelect('cs.skill', 'skill')
      .where('cs.curriculumId = :curriculumId', { curriculumId: curriculum.id })
      .getMany();

    const skills = curriculumSkills.map(
      (cs) => new Skill(cs.skill.id, cs.skill.name),
    );

    const contact = new Contact(
      curriculum.student.contact.id,
      curriculum.student.contact.phone,
      curriculum.student.contact.neighbourhood ?? undefined,
      curriculum.student.contact.state ?? undefined,
      curriculum.student.contact.city ?? undefined,
      curriculum.student.contact.address ?? undefined,
      curriculum.student.contact.cep ?? undefined,
      curriculum.student.contact.complement ?? undefined,
    );

    const student = new Student(
      curriculum.student.id,
      curriculum.student.user.password,
      curriculum.student.user.email,
      curriculum.student.cpf,
      contact,
      curriculum.student.birthDate,
      curriculum.student.gender,
      curriculum.student.race,
      curriculum.student.fullName,
      curriculum.student.education ?? undefined,
      curriculum.student.institution ?? undefined,
      curriculum.student.activityArea ?? undefined,
      curriculum.student.hasProgrammingExperience ?? undefined,
      curriculum.student.motivation ?? undefined,
      curriculum.student.howHeard ?? undefined,
      curriculum.student.hasComputer ?? undefined,
      curriculum.student.hasInternet ?? undefined,
      curriculum.student.committedToParticipate ?? undefined,
      undefined,
      [],
      curriculum.student.socialName ?? undefined,
      curriculum.student.courseName ?? undefined,
      curriculum.student.familyIncome ?? undefined,
    );

    return new Curriculum(
      curriculum.id,
      curriculum.isAvailable,
      curriculum.linkedin,
      curriculum.github,
      curriculum.videoPresentation,
      student,
      skills,
      curriculum.about,
      curriculum.profilePhoto,
    );
  }
}