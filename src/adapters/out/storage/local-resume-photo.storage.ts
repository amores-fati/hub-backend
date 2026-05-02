import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import { Injectable } from '@nestjs/common';

import {
  IResumePhotoStorage,
  SaveResumePhotoCommand,
} from '../../../core/ports/resume-photo-storage.interface';

const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class LocalResumePhotoStorage implements IResumePhotoStorage {
  async save(command: SaveResumePhotoCommand): Promise<string> {
    const extension = MIME_EXTENSION[command.mimeType];
    const fileName = `${randomUUID()}.${extension}`;
    const relativeDirectory = join('resume-photos', command.studentId);
    const uploadsDirectory = join(process.cwd(), 'uploads', relativeDirectory);

    await mkdir(uploadsDirectory, { recursive: true });
    await writeFile(join(uploadsDirectory, fileName), command.buffer);

    return `/uploads/${relativeDirectory.replace(/\\/g, '/')}/${fileName}`;
  }
}
