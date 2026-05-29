import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { JobOpeningOrmEntity } from '../orm/job-opening.orm-entity';
import { JobSkillOrmEntity } from '../orm/job-skill.orm-entity';
import { SkillOrmEntity } from '../orm/skill.orm-entity';
import {
  IJobOpeningRepository,
  JobOpeningResult,
} from '../../../core/ports/job-open.company.repository.interface';
import {
  CreateJobOpeningCommand,
  UpdateJobOpeningCommand,
} from '../../../core/command/job-opening.command';

@Injectable()
export class JobOpeningRepository implements IJobOpeningRepository {
  constructor(
    @InjectRepository(JobOpeningOrmEntity)
    private readonly ormRepository: Repository<JobOpeningOrmEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async countActive(): Promise<number> {
    return this.ormRepository.count({ where: { isActive: true } });
  }

  async create(command: CreateJobOpeningCommand): Promise<JobOpeningResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const job = queryRunner.manager.create(JobOpeningOrmEntity, {
        company: { id: command.companyId },
        name: command.title,
        description: command.description,
        openingsCount: command.vacancyCount,
        applicationLink: command.link,
        isPcd: command.isPcd,
        workplaceType: command.workplaceType,
      });
      const savedJob = await queryRunner.manager.save(JobOpeningOrmEntity, job);

      if (command.skills && command.skills.length > 0) {
        await this.upsertSkillsAndLink(
          queryRunner.manager,
          savedJob.id,
          command.skills,
        );
      }

      await queryRunner.commitTransaction();
      return this.toResult(savedJob);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: string,
    command: UpdateJobOpeningCommand,
  ): Promise<JobOpeningResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.update(JobOpeningOrmEntity, id, {
        name: command.title,
        description: command.description,
        openingsCount: command.vacancyCount,
        applicationLink: command.link,
        isPcd: command.isPcd,
        workplaceType: command.workplaceType,
      });

      await queryRunner.manager.delete(JobSkillOrmEntity, { jobId: id });

      if (command.skills && command.skills.length > 0) {
        await this.upsertSkillsAndLink(queryRunner.manager, id, command.skills);
      }

      const updated = await queryRunner.manager.findOneOrFail(
        JobOpeningOrmEntity,
        { where: { id } },
      );

      await queryRunner.commitTransaction();
      return this.toResult(updated);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async upsertSkillsAndLink(
    manager: DataSource['manager'],
    jobId: string,
    skillNames: string[],
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .insert()
      .into(SkillOrmEntity)
      .values(skillNames.map((name) => ({ id: randomUUID(), name })))
      .orIgnore()
      .execute();

    const skills = await manager.find(SkillOrmEntity, {
      where: { name: In(skillNames) },
    });

    await manager
      .createQueryBuilder()
      .insert()
      .into(JobSkillOrmEntity)
      .values(skills.map((skill) => ({ jobId, skillId: skill.id })))
      .execute();
  }

  private toResult(entity: JobOpeningOrmEntity): JobOpeningResult {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      openingsCount: entity.openingsCount,
      applicationLink: entity.applicationLink,
      isPcd: entity.isPcd,
      workplaceType: entity.workplaceType,
      announcementDate: entity.announcementDate,
    };
  }
}
