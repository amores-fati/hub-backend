export interface CurriculumSkill {
  id: string;
  skillName: string;
}

export class Curriculum {
  constructor(
    readonly id: string,
    readonly studentId: string,
    private aboutValue: string | null = null,
    private linkedinUrlValue: string | null = null,
    private githubUrlValue: string | null = null,
    private photoUrlValue: string | null = null,
    private skillValues: CurriculumSkill[] = [],
    private preferenceValue: string | null = null,
  ) {}

  get about(): string | null {
    return this.aboutValue;
  }

  get linkedinUrl(): string | null {
    return this.linkedinUrlValue;
  }

  get githubUrl(): string | null {
    return this.githubUrlValue;
  }

  get photoUrl(): string | null {
    return this.photoUrlValue;
  }

  get skills(): CurriculumSkill[] {
    return [...this.skillValues];
  }

  get preference(): string | null {
    return this.preferenceValue;
  }

  updateProfile(data: {
    about?: string | null;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    preference?: string | null;
  }): void {
    if (data.about !== undefined) {
      this.aboutValue = data.about;
    }

    if (data.linkedinUrl !== undefined) {
      this.linkedinUrlValue = data.linkedinUrl;
    }

    if (data.githubUrl !== undefined) {
      this.githubUrlValue = data.githubUrl;
    }

    if (data.preference !== undefined) {
      this.preferenceValue = data.preference;
    }
  }

  changePhotoUrl(photoUrl: string): void {
    this.photoUrlValue = photoUrl;
  }

  hasSkillName(skillName: string): boolean {
    const normalizedSkillName = skillName.trim().toLowerCase();

    return this.skillValues.some(
      (skill) => skill.skillName.trim().toLowerCase() === normalizedSkillName,
    );
  }

  hasSkill(skillId: string): boolean {
    return this.skillValues.some((skill) => skill.id === skillId);
  }

  addSkill(skill: CurriculumSkill): void {
    this.skillValues = [...this.skillValues, skill];
  }

  removeSkill(skillId: string): void {
    this.skillValues = this.skillValues.filter((skill) => skill.id !== skillId);
  }

  toJSON() {
    return {
      id: this.id,
      about: this.about,
      linkedinUrl: this.linkedinUrl,
      githubUrl: this.githubUrl,
      photoUrl: this.photoUrl,
      skills: this.skills,
      preference: this.preference,
    };
  }
}
