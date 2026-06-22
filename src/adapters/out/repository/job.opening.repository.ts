import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JobOpeningOrmEntity } from '../orm/job-opening.orm-entity';
import { JobSkillOrmEntity } from '../orm/job-skill.orm-entity';
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

  async findById(id: string): Promise<JobOpeningResult | null> {
    const entity = await this.ormRepository.findOne({
      where: { id },
      relations: ['skills', 'skills.skill'],
    });
    if (!entity) return null;
    return this.toResult(entity);
  }

  async create(command: CreateJobOpeningCommand): Promise<JobOpeningResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const job = queryRunner.manager.create(JobOpeningOrmEntity, {
        company: { id: command.companyId },
        name: command.name,
        description: command.description,
        openingsCount: command.openingsCount,
        applicationLink: command.applicationLink,
        isPcd: command.isPcd,
        workplaceType: command.workplaceType,
      });
      const savedJob = await queryRunner.manager.save(JobOpeningOrmEntity, job);

      if (command.skills && command.skills.length > 0) {
        await this.linkSkillsByIds(
          queryRunner.manager,
          savedJob.id,
          command.skills,
        );
      }

      const withSkills = await queryRunner.manager.findOne(
        JobOpeningOrmEntity,
        {
          where: { id: savedJob.id },
          relations: ['skills', 'skills.skill'],
        },
      );

      await queryRunner.commitTransaction();
      return this.toResult(withSkills!);
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
        name: command.name,
        description: command.description,
        openingsCount: command.openingsCount,
        applicationLink: command.applicationLink,
        isPcd: command.isPcd,
        workplaceType: command.workplaceType,
      });

      await queryRunner.manager.delete(JobSkillOrmEntity, { jobId: id });

      if (command.skills && command.skills.length > 0) {
        await this.linkSkillsByIds(queryRunner.manager, id, command.skills);
      }

      const updated = await queryRunner.manager.findOneOrFail(
        JobOpeningOrmEntity,
        { where: { id }, relations: ['skills', 'skills.skill'] },
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

  private async linkSkillsByIds(
    manager: DataSource['manager'],
    jobId: string,
    skillIds: string[],
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .insert()
      .into(JobSkillOrmEntity)
      .values(skillIds.map((skillId) => ({ jobId, skillId })))
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
      skills:
        entity.skills
          ?.map((js) => ({ id: js.skill?.id, name: js.skill?.name }))
          .filter((s) => s.id && s.name) ?? [],
    };
  }
}
