import {
  CreateJobOpeningCommand,
  UpdateJobOpeningCommand,
} from '../command/job-opening.command';

export const IJobOpeningRepository = Symbol('IJobOpeningRepository');

export interface JobOpeningResult {
  id: string;
  name: string;
  description: string;
  openingsCount: number;
  applicationLink: string | null;
  isPcd: boolean;
  workplaceType: string;
  announcementDate: Date;
}

export interface IJobOpeningRepository {
  countActive(): Promise<number>;
  create(command: CreateJobOpeningCommand): Promise<JobOpeningResult>;
  update(
    id: string,
    command: UpdateJobOpeningCommand,
  ): Promise<JobOpeningResult>;
}
