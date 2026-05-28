import { Curriculum, CurriculumSkill } from '../domain/curriculum.entity';

export const ICurriculumRepository = Symbol('ICurriculumRepository');

export interface ResumeListProjection {
  id: string;
  studentId: string;
  cpf: string;
  fullName: string;
  socialName?: string;
  email: string;
  isAvailable: boolean;
  about?: string;
  linkedin?: string;
  github?: string;
  preference?: string;
  phone?: string;
}

export interface PaginatedResumeListResult {
  items: ResumeListProjection[];
  total: number;
}

export interface ResumeFilterQuery {
  search?: string;
  interestArea?: string;
  preference?: string;
  status?: string;
  page: number;
  limit: number;
}

export interface ICurriculumRepository {
  findByStudentId(studentId: string): Promise<Curriculum | null>;
  save(curriculum: Curriculum): Promise<Curriculum>;
  findOrCreateSkillByName(skillName: string): Promise<CurriculumSkill>;
  addSkillToCurriculum(curriculumId: string, skillId: string): Promise<void>;
  removeSkillFromCurriculum(
    curriculumId: string,
    skillId: string,
  ): Promise<void>;
  findAllWithFilter(
    query: ResumeFilterQuery,
  ): Promise<PaginatedResumeListResult>;
}
