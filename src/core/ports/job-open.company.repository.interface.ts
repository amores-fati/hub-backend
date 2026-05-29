export const IJobOpeningRepository = Symbol('IJobOpeningRepository');

export interface IJobOpeningRepository {
  countActive(): Promise<number>;
}