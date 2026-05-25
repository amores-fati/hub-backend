export enum EnrollmentType {
  ENROLLMENT = 'INSCRICAO',
  INTEREST = 'INTERESSE',
}

export class Enrollment {
  readonly #id: string;
  readonly #studentId: string;
  readonly #courseId: string;
  readonly #type: EnrollmentType;
  readonly #createdAt: Date;

  constructor(
    id: string,
    studentId: string,
    courseId: string,
    type: EnrollmentType,
    createdAt: Date,
  ) {
    this.#id = id;
    this.#studentId = studentId;
    this.#courseId = courseId;
    this.#type = type;
    this.#createdAt = createdAt;
  }

  get id(): string {
    return this.#id;
  }

  get studentId(): string {
    return this.#studentId;
  }

  get courseId(): string {
    return this.#courseId;
  }

  get type(): EnrollmentType {
    return this.#type;
  }

  get createdAt(): Date {
    return this.#createdAt;
  }

  toJSON() {
    return {
      id: this.#id,
      studentId: this.#studentId,
      courseId: this.#courseId,
      type: this.#type,
      createdAt: this.#createdAt,
    };
  }
}
