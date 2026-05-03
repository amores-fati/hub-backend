export const IResumePhotoStorage = Symbol('IResumePhotoStorage');

export interface SaveResumePhotoCommand {
  studentId: string;
  originalName?: string;
  mimeType: string;
  buffer: Buffer;
}

export interface IResumePhotoStorage {
  save(command: SaveResumePhotoCommand): Promise<string>;
}
