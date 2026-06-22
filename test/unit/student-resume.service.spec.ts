/* eslint-disable @typescript-eslint/unbound-method */
import { Curriculum } from '../../src/core/domain/curriculum.entity';
import { EmptyResumeSkillNameException } from '../../src/core/exceptions/empty-resume-skill-name.exception';
import { InvalidResumePhotoException } from '../../src/core/exceptions/invalid-resume-photo.exception';
import { InvalidResumeUrlException } from '../../src/core/exceptions/invalid-resume-url.exception';
import { ResumeSkillAlreadyExistsException } from '../../src/core/exceptions/resume-skill-already-exists.exception';
import { ResumeSkillNotFoundException } from '../../src/core/exceptions/resume-skill-not-found.exception';
import { ResumeNotFoundException } from '../../src/core/exceptions/resume-not-found.exception';
import { SkillNotFoundException } from '../../src/core/exceptions/skill-not-found.exception';
import { ICurriculumRepository } from '../../src/core/ports/curriculum.repository.interface';
import { IStudentRepository } from '../../src/core/ports/student.repository.interface';
import {
  MAX_RESUME_PHOTO_SIZE_BYTES,
  StudentResumeService,
} from '../../src/core/services/student-resume.service';

describe('StudentResumeService', () => {
  const studentId = '123e4567-e89b-12d3-a456-426614174000';
  let service: StudentResumeService;

  const curriculumRepository: jest.Mocked<ICurriculumRepository> = {
    findByStudentId: jest.fn(),
    save: jest.fn(),
    findSkillByName: jest.fn(),
    addSkillToCurriculum: jest.fn(),
    removeSkillFromCurriculum: jest.fn(),
  };

  const studentRepository: jest.Mocked<IStudentRepository> = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllWithFilter: jest.fn(),
    findById: jest.fn(),
    existsById: jest.fn(),
    findByCpf: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDeleteMany: jest.fn(),
    findDisabilitiesByNames: jest.fn(),
    findSocialBenefitsByNames: jest.fn(),
    findLocations: jest.fn(),
    findManyForReportByIds: jest.fn(),
    findManyForReportByFilters: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StudentResumeService(curriculumRepository, studentRepository);
  });

  describe('getResume', () => {
    it('should return the student resume with skills', async () => {
      const curriculum = buildCurriculum();
      curriculumRepository.findByStudentId.mockResolvedValue(curriculum);

      const result = await service.getResume(studentId);

      expect(result).toBe(curriculum);
      expect(curriculumRepository.findByStudentId).toHaveBeenCalledWith(
        studentId,
      );
    });

    it('should throw ResumeNotFoundException when resume does not exist', async () => {
      curriculumRepository.findByStudentId.mockResolvedValue(null);

      await expect(service.getResume(studentId)).rejects.toThrow(
        ResumeNotFoundException,
      );
    });
  });

  describe('upsertResume', () => {
    beforeEach(() => {
      curriculumRepository.save.mockImplementation((curriculum) =>
        Promise.resolve(curriculum),
      );
    });

    it('should create the resume when it does not exist', async () => {
      curriculumRepository.findByStudentId.mockResolvedValue(null);
      studentRepository.existsById.mockResolvedValue(true);

      const result = await service.upsertResume(studentId, {
        about: 'Perfil profissional',
        linkedinUrl: 'https://www.linkedin.com/in/aluno',
        githubUrl: 'https://github.com/aluno',
      });

      expect(result.studentId).toBe(studentId);
      expect(result.about).toBe('Perfil profissional');
      expect(result.linkedinUrl).toBe('https://www.linkedin.com/in/aluno');
      expect(result.githubUrl).toBe('https://github.com/aluno');
      expect(studentRepository.existsById).toHaveBeenCalledWith(studentId);
      expect(curriculumRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should update only provided fields when resume already exists', async () => {
      curriculumRepository.findByStudentId.mockResolvedValue(buildCurriculum());

      const result = await service.upsertResume(studentId, {
        about: null,
        githubUrl: 'https://github.com/novo',
      });

      expect(result.about).toBeNull();
      expect(result.linkedinUrl).toBe('https://www.linkedin.com/in/aluno');
      expect(result.githubUrl).toBe('https://github.com/novo');
      expect(studentRepository.existsById).not.toHaveBeenCalled();
      expect(curriculumRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should reject malformed URLs', async () => {
      await expect(
        service.upsertResume(studentId, {
          linkedinUrl: 'linkedin.com/aluno',
        }),
      ).rejects.toThrow(InvalidResumeUrlException);

      expect(curriculumRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('uploadPhoto', () => {
    beforeEach(() => {
      curriculumRepository.save.mockImplementation((curriculum) =>
        Promise.resolve(curriculum),
      );
    });

    it('should validate, store and update resume photo', async () => {
      curriculumRepository.findByStudentId.mockResolvedValue(null);
      studentRepository.existsById.mockResolvedValue(true);

      const result = await service.uploadPhoto(studentId, {
        originalName: 'photo.png',
        mimeType: 'image/png',
        size: 1024,
        buffer: Buffer.from('image'),
      });

      expect(result).toEqual({
        photoUrl: `/api/students/${studentId}/resume/photo`,
      });
      expect(curriculumRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId,
          photoBufferValue: Buffer.from('image'),
          photoMimeTypeValue: 'image/png',
        }),
      );
    });

    it('should reject unsupported MIME types', async () => {
      await expect(
        service.uploadPhoto(studentId, {
          originalName: 'photo.gif',
          mimeType: 'image/gif',
          size: 1024,
          buffer: Buffer.from('image'),
        }),
      ).rejects.toThrow(InvalidResumePhotoException);
    });

    it('should reject files larger than 5 MB', async () => {
      await expect(
        service.uploadPhoto(studentId, {
          originalName: 'photo.png',
          mimeType: 'image/png',
          size: MAX_RESUME_PHOTO_SIZE_BYTES + 1,
          buffer: Buffer.from('image'),
        }),
      ).rejects.toThrow(InvalidResumePhotoException);
    });
  });

  describe('addSkill', () => {
    beforeEach(() => {
      curriculumRepository.save.mockImplementation((curriculum) =>
        Promise.resolve(curriculum),
      );
      curriculumRepository.findSkillByName.mockResolvedValue({
        id: 'new-skill-id',
        skillName: 'Node.js',
      });
      curriculumRepository.addSkillToCurriculum.mockResolvedValue(undefined);
    });

    it('should add a skill and create the resume when it does not exist', async () => {
      curriculumRepository.findByStudentId.mockResolvedValue(null);
      studentRepository.existsById.mockResolvedValue(true);

      const result = await service.addSkill(studentId, {
        skillName: ' Node.js ',
      });

      expect(result).toEqual({ id: 'new-skill-id', skillName: 'Node.js' });
      expect(studentRepository.existsById).toHaveBeenCalledWith(studentId);
      expect(curriculumRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ studentId }),
      );
      expect(curriculumRepository.findSkillByName).toHaveBeenCalledWith(
        'Node.js',
      );
      expect(curriculumRepository.addSkillToCurriculum).toHaveBeenCalledWith(
        expect.any(String),
        'new-skill-id',
      );
    });

    it('should reject a skill that is not in the catalog', async () => {
      curriculumRepository.findByStudentId.mockResolvedValue(null);
      studentRepository.existsById.mockResolvedValue(true);
      curriculumRepository.findSkillByName.mockResolvedValue(null);

      await expect(
        service.addSkill(studentId, { skillName: 'COBOL' }),
      ).rejects.toThrow(SkillNotFoundException);

      expect(curriculumRepository.save).not.toHaveBeenCalled();
      expect(curriculumRepository.addSkillToCurriculum).not.toHaveBeenCalled();
    });

    it('should reject empty skill names', async () => {
      await expect(
        service.addSkill(studentId, { skillName: '   ' }),
      ).rejects.toThrow(EmptyResumeSkillNameException);

      expect(curriculumRepository.findByStudentId).not.toHaveBeenCalled();
      expect(curriculumRepository.save).not.toHaveBeenCalled();
    });

    it('should reject duplicated skills case-insensitively', async () => {
      curriculumRepository.findByStudentId.mockResolvedValue(buildCurriculum());

      await expect(
        service.addSkill(studentId, { skillName: 'typescript' }),
      ).rejects.toThrow(ResumeSkillAlreadyExistsException);

      expect(curriculumRepository.save).not.toHaveBeenCalled();
      expect(curriculumRepository.addSkillToCurriculum).not.toHaveBeenCalled();
    });
  });

  describe('removeSkill', () => {
    it('should remove a skill when it belongs to the authenticated student resume', async () => {
      curriculumRepository.findByStudentId.mockResolvedValue(buildCurriculum());
      curriculumRepository.removeSkillFromCurriculum.mockResolvedValue(
        undefined,
      );

      await service.removeSkill(studentId, 'skill-id');

      expect(
        curriculumRepository.removeSkillFromCurriculum,
      ).toHaveBeenCalledWith('resume-id', 'skill-id');
    });

    it('should throw ResumeSkillNotFoundException when resume does not exist', async () => {
      curriculumRepository.findByStudentId.mockResolvedValue(null);

      await expect(service.removeSkill(studentId, 'skill-id')).rejects.toThrow(
        ResumeSkillNotFoundException,
      );

      expect(
        curriculumRepository.removeSkillFromCurriculum,
      ).not.toHaveBeenCalled();
    });

    it('should throw ResumeSkillNotFoundException when skill does not belong to the resume', async () => {
      curriculumRepository.findByStudentId.mockResolvedValue(buildCurriculum());

      await expect(
        service.removeSkill(studentId, 'other-skill-id'),
      ).rejects.toThrow(ResumeSkillNotFoundException);

      expect(
        curriculumRepository.removeSkillFromCurriculum,
      ).not.toHaveBeenCalled();
    });
  });
});

function buildCurriculum(): Curriculum {
  return new Curriculum(
    'resume-id',
    '123e4567-e89b-12d3-a456-426614174000',
    'Sobre o aluno',
    'https://www.linkedin.com/in/aluno',
    'https://github.com/aluno',
    'https://www.youtube.com/watch?v=abc123',
    '/uploads/photo.webp',
    null,
    null,
    [{ id: 'skill-id', skillName: 'TypeScript' }],
  );
}
