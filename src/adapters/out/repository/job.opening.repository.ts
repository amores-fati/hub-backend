import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobOpeningOrmEntity } from '../orm/job-opening.orm-entity';
import { IJobOpeningRepository } from '../../../core/ports/job-open.company.repository.interface';

@Injectable()
export class JobOpeningRepository implements IJobOpeningRepository {
  constructor(
    @InjectRepository(JobOpeningOrmEntity)
    private readonly ormRepository: Repository<JobOpeningOrmEntity>,
  ) {}

  async countActive(): Promise<number> {
    return this.ormRepository.count({
      where: { isActive: true },
    });
  }
}
