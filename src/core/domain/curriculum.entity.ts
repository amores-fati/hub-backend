import { DomainException } from '../exceptions/domain.exception';
import { Skill } from './skill.entity';
import { Student } from './student.entity';

export class Curriculum {
  readonly #id: string;
  readonly #isAvailable: boolean;
  readonly #about: string | null;
  readonly #linkedin: string;
  readonly #github: string;
  readonly #profilePhoto: string | null;
  readonly #videoPresentation: string;
  readonly #skills: Skill[];
  readonly #student: Student;

  constructor(
    id: string,
    isAvailable: boolean,
    linkedin: string,
    github: string,
    videoPresentation: string,
    student: Student,
    skills: Skill[] = [],
    about?: string | null,
    profilePhoto?: string | null,
  ) {
    this.#id = id;
    this.#isAvailable = isAvailable;
    this.#linkedin = linkedin;
    this.#github = github;
    this.#videoPresentation = videoPresentation;
    this.#student = student;
    this.#skills = skills;
    this.#about = about ?? null;
    this.#profilePhoto = profilePhoto ?? null;
    this.validate();
  }

  get id(): string { return this.#id; }
  get isAvailable(): boolean { return this.#isAvailable; }
  get about(): string | null { return this.#about; }
  get linkedin(): string { return this.#linkedin; }
  get github(): string { return this.#github; }
  get profilePhoto(): string | null { return this.#profilePhoto; }
  get videoPresentation(): string { return this.#videoPresentation; }
  get skills(): Skill[] { return this.#skills; }
  get student(): Student { return this.#student; }

  private validate(): void {
    if (!this.#id || this.#id.trim().length === 0) {
      throw new DomainException('O id do currículo é obrigatório.');
    }
    if (!this.#linkedin || this.#linkedin.trim().length === 0) {
      throw new DomainException('O LinkedIn é obrigatório.');
    }
    if (!this.#github || this.#github.trim().length === 0) {
      throw new DomainException('O GitHub é obrigatório.');
    }
    if (!this.#videoPresentation || this.#videoPresentation.trim().length === 0) {
      throw new DomainException('O vídeo de apresentação é obrigatório.');
    }
    if (!Array.isArray(this.#skills)) {
      throw new DomainException('As habilidades devem ser uma lista válida.');
    }
  }

  toJSON() {
    return {
      id: this.id,
      isAvailable: this.isAvailable,
      about: this.about,
      linkedin: this.linkedin,
      github: this.github,
      profilePhoto: this.profilePhoto,
      videoPresentation: this.videoPresentation,
      skills: this.skills.map((s) => s.toJSON()),
      student: this.student.toJSON(),
    };
  }
}