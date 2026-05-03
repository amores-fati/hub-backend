import { Curriculum, CurriculumSkill } from '../domain/curriculum.entity';

export const ICurriculumRepository = Symbol('ICurriculumRepository');

export interface ICurriculumRepository {
  findByStudentId(studentId: string): Promise<Curriculum | null>;
  save(curriculum: Curriculum): Promise<Curriculum>;
  findOrCreateSkillByName(skillName: string): Promise<CurriculumSkill>;
  addSkillToCurriculum(curriculumId: string, skillId: string): Promise<void>;
  removeSkillFromCurriculum(
    curriculumId: string,
    skillId: string,
  ): Promise<void>;
}
