/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { StudentResumeController } from '../../src/adapters/in/controllers/student-resume.controller';
import { Curriculum } from '../../src/core/domain/curriculum.entity';
import { EmptyResumeSkillNameException } from '../../src/core/exceptions/empty-resume-skill-name.exception';
import { InvalidResumePhotoException } from '../../src/core/exceptions/invalid-resume-photo.exception';
import { InvalidResumeUrlException } from '../../src/core/exceptions/invalid-resume-url.exception';
import { ResumeSkillAlreadyExistsException } from '../../src/core/exceptions/resume-skill-already-exists.exception';
import { ResumeSkillNotFoundException } from '../../src/core/exceptions/resume-skill-not-found.exception';
import { ResumeNotFoundException } from '../../src/core/exceptions/resume-not-found.exception';
import { StudentResumeService } from '../../src/core/services/student-resume.service';
import { AuthenticatedUser } from '../../src/utils/decorators/current-user.decorator';
import { AmoresFatiLogger } from '../../src/utils/logger';

describe('StudentResumeController', () => {
  const user: AuthenticatedUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'aluno@teste.com',
    role: 'STUDENT' as AuthenticatedUser['role'],
  };

  let controller: StudentResumeController;
  let service: jest.Mocked<StudentResumeService>;
  let logger: jest.Mocked<AmoresFatiLogger>;

  beforeEach(async () => {
    const serviceMock = {
      getResume: jest.fn(),
      upsertResume: jest.fn(),
      uploadPhoto: jest.fn(),
      addSkill: jest.fn(),
      removeSkill: jest.fn(),
    };
    const loggerMock = {
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentResumeController],
      providers: [
        {
          provide: StudentResumeService,
          useValue: serviceMock,
        },
        {
          provide: AmoresFatiLogger,
          useValue: loggerMock,
        },
      ],
    }).compile();

    controller = module.get<StudentResumeController>(StudentResumeController);
    service = module.get(StudentResumeService);
    logger = module.get(AmoresFatiLogger);
  });

  describe('getResume', () => {
    it('should return authenticated student resume', async () => {
      service.getResume.mockResolvedValue(buildCurriculum());

      const result = await controller.getResume(user);

      expect(result).toEqual({
        id: 'resume-id',
        about: 'Sobre o aluno',
        linkedinUrl: 'https://www.linkedin.com/in/aluno',
        githubUrl: 'https://github.com/aluno',
        videoPresentationUrl: 'https://www.youtube.com/watch?v=abc123',
        photoUrl: '/api/students/student-id/resume/photo',
        skills: [{ id: 'skill-id', skillName: 'TypeScript' }],
      });
      expect(service.getResume).toHaveBeenCalledWith(user.id);
      expect(logger.info).toHaveBeenCalledWith(
        'Fetching authenticated student resume',
        { userId: user.id },
      );
    });

    it('should map missing resume to NOT_FOUND response', async () => {
      service.getResume.mockRejectedValue(new ResumeNotFoundException(user.id));

      await expect(controller.getResume(user)).rejects.toThrow(
        NotFoundException,
      );

      try {
        await controller.getResume(user);
      } catch (error) {
        expect((error as NotFoundException).getResponse()).toMatchObject({
          errorKind: 'NOT_FOUND',
        });
      }
    });
  });

  describe('upsertResume', () => {
    it('should return updated resume', async () => {
      service.upsertResume.mockResolvedValue(buildCurriculum());

      const result = await controller.upsertResume(user, {
        about: 'Sobre o aluno',
      });

      expect(result.id).toBe('resume-id');
      expect(service.upsertResume).toHaveBeenCalledWith(user.id, {
        about: 'Sobre o aluno',
      });
    });

    it('should map malformed URLs to VALIDATION_ERROR response', async () => {
      service.upsertResume.mockRejectedValue(
        new InvalidResumeUrlException('linkedinUrl'),
      );

      await expect(
        controller.upsertResume(user, { linkedinUrl: 'invalid' }),
      ).rejects.toThrow(BadRequestException);

      try {
        await controller.upsertResume(user, { linkedinUrl: 'invalid' });
      } catch (error) {
        expect((error as BadRequestException).getResponse()).toMatchObject({
          errorKind: 'VALIDATION_ERROR',
        });
      }
    });
  });

  describe('uploadPhoto', () => {
    it('should return uploaded photo URL', async () => {
      service.uploadPhoto.mockResolvedValue({
        photoUrl: `/api/students/${user.id}/resume/photo`,
      });

      const result = await controller.uploadPhoto(user, {
        originalname: 'photo.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('image'),
      });

      expect(result).toEqual({
        photoUrl: `/api/students/${user.id}/resume/photo`,
      });
      expect(service.uploadPhoto).toHaveBeenCalledWith(user.id, {
        originalName: 'photo.png',
        mimeType: 'image/png',
        size: 1024,
        buffer: Buffer.from('image'),
      });
    });

    it('should map invalid files to INVALID_FILE response', async () => {
      service.uploadPhoto.mockRejectedValue(new InvalidResumePhotoException());

      await expect(controller.uploadPhoto(user, undefined)).rejects.toThrow(
        BadRequestException,
      );

      try {
        await controller.uploadPhoto(user, undefined);
      } catch (error) {
        expect((error as BadRequestException).getResponse()).toMatchObject({
          errorKind: 'INVALID_FILE',
        });
      }
    });
  });

  describe('addSkill', () => {
    it('should return created resume skill', async () => {
      service.addSkill.mockResolvedValue({
        id: 'skill-id',
        skillName: 'Node.js',
      });

      const result = await controller.addSkill(user, {
        skillName: 'Node.js',
      });

      expect(result).toEqual({ id: 'skill-id', skillName: 'Node.js' });
      expect(service.addSkill).toHaveBeenCalledWith(user.id, {
        skillName: 'Node.js',
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Adding authenticated student resume skill',
        { userId: user.id },
      );
    });

    it('should map empty skill names to VALIDATION_ERROR response', async () => {
      service.addSkill.mockRejectedValue(new EmptyResumeSkillNameException());

      await expect(
        controller.addSkill(user, { skillName: '   ' }),
      ).rejects.toThrow(BadRequestException);

      try {
        await controller.addSkill(user, { skillName: '   ' });
      } catch (error) {
        expect((error as BadRequestException).getResponse()).toMatchObject({
          errorKind: 'VALIDATION_ERROR',
        });
      }
    });

    it('should map duplicated skills to CONFLICT response', async () => {
      service.addSkill.mockRejectedValue(
        new ResumeSkillAlreadyExistsException('TypeScript'),
      );

      await expect(
        controller.addSkill(user, { skillName: 'TypeScript' }),
      ).rejects.toThrow(ConflictException);

      try {
        await controller.addSkill(user, { skillName: 'TypeScript' });
      } catch (error) {
        expect((error as ConflictException).getResponse()).toMatchObject({
          errorKind: 'CONFLICT',
        });
      }
    });
  });

  describe('removeSkill', () => {
    it('should remove the resume skill', async () => {
      service.removeSkill.mockResolvedValue(undefined);

      await expect(
        controller.removeSkill(user, 'skill-id'),
      ).resolves.toBeUndefined();

      expect(service.removeSkill).toHaveBeenCalledWith(user.id, 'skill-id');
      expect(logger.info).toHaveBeenCalledWith(
        'Removing authenticated student resume skill',
        { userId: user.id, skillId: 'skill-id' },
      );
    });

    it('should map missing or foreign skills to NOT_FOUND response', async () => {
      service.removeSkill.mockRejectedValue(
        new ResumeSkillNotFoundException('skill-id'),
      );

      await expect(controller.removeSkill(user, 'skill-id')).rejects.toThrow(
        NotFoundException,
      );

      try {
        await controller.removeSkill(user, 'skill-id');
      } catch (error) {
        expect((error as NotFoundException).getResponse()).toMatchObject({
          errorKind: 'NOT_FOUND',
        });
      }
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
    '/api/students/student-id/resume/photo',
    null,
    null,
    [{ id: 'skill-id', skillName: 'TypeScript' }],
  );
}
