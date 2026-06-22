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
  isPcd: boolean;
  about?: string;
  linkedin?: string;
  github?: string;
  preference?: string;
  phone?: string;
  photoUrl?: string;
  city?: string;
  state?: string;
}

export interface PaginatedResumeListResult {
  items: ResumeListProjection[];
  total: number;
}

export interface ResumeFilterQuery {
  search?: string;
  activityArea?: string[];
  preference?: string;
  status?: string;
  city?: string[];
  isPcd?: boolean;
  page: number;
  limit: number;
}

export interface ICurriculumRepository {
  findByStudentId(studentId: string): Promise<Curriculum | null>;
  save(curriculum: Curriculum): Promise<Curriculum>;
  /**
   * Busca uma skill do catálogo pelo nome (case-insensitive). Retorna null se
   * a skill não existir — o catálogo é fechado, o app não cria skills novas.
   */
  findSkillByName(skillName: string): Promise<CurriculumSkill | null>;
  addSkillToCurriculum(curriculumId: string, skillId: string): Promise<void>;
  removeSkillFromCurriculum(
    curriculumId: string,
    skillId: string,
  ): Promise<void>;
  findAllWithFilter(
    query: ResumeFilterQuery,
  ): Promise<PaginatedResumeListResult>;
}
