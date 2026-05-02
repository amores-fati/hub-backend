import { Curriculum } from '../domain/curriculum.entity';

export const ICurriculumRepository = Symbol('ICurriculumRepository');

export interface ICurriculumRepository {
  findActiveResumeByStudentId(studentId: string): Promise<Curriculum | null>;
}