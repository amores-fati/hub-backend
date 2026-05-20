export interface UpsertStudentResumeCommand {
  about?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  preference?: string | null;
}

export interface UploadStudentResumePhotoCommand {
  originalName?: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export interface AddStudentResumeSkillCommand {
  skillName: string;
}
