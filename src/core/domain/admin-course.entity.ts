import { DomainException } from '../exceptions/domain.exception';

export class AdminCourse {
  readonly #id: string;
  #name: string;
  #description: string;
  #modality: string;
  #shift: string;
  #imageUrl?: string;
  #address?: string;
  #vacancyCount?: number;
  #workloadHours?: number;
  #startDate?: Date;
  #endDate?: Date;
  #enrollmentStart?: Date;
  #enrollmentEnd?: Date;

  constructor(
    id: string,
    name: string,
    description: string,
    modality: string,
    shift: string,
    imageUrl?: string,
    address?: string,
    vacancyCount?: number,
    workloadHours?: number,
    startDate?: Date,
    endDate?: Date,
    enrollmentStart?: Date,
    enrollmentEnd?: Date,
  ) {
    this.#id = id;
    this.#name = name;
    this.#description = description;
    this.#modality = modality;
    this.#shift = shift;
    this.#imageUrl = imageUrl;
    this.#address = address;
    this.#vacancyCount = vacancyCount;
    this.#workloadHours = workloadHours;
    this.#startDate = startDate;
    this.#endDate = endDate;
    this.#enrollmentStart = enrollmentStart;
    this.#enrollmentEnd = enrollmentEnd;
    this.validate();
  }

  get id(): string {
    return this.#id;
  }
  get name(): string {
    return this.#name;
  }
  get description(): string {
    return this.#description;
  }
  get modality(): string {
    return this.#modality;
  }
  get shift(): string {
    return this.#shift;
  }
  get imageUrl(): string | undefined {
    return this.#imageUrl;
  }
  get address(): string | undefined {
    return this.#address;
  }
  get vacancyCount(): number | undefined {
    return this.#vacancyCount;
  }
  get workloadHours(): number | undefined {
    return this.#workloadHours;
  }
  get startDate(): Date | undefined {
    return this.#startDate;
  }
  get endDate(): Date | undefined {
    return this.#endDate;
  }
  get enrollmentStart(): Date | undefined {
    return this.#enrollmentStart;
  }
  get enrollmentEnd(): Date | undefined {
    return this.#enrollmentEnd;
  }

  update(
    name: string,
    description: string,
    modality: string,
    shift: string,
    imageUrl?: string,
    address?: string,
    vacancyCount?: number,
    workloadHours?: number,
    startDate?: Date,
    endDate?: Date,
    enrollmentStart?: Date,
    enrollmentEnd?: Date,
  ): void {
    this.#name = name;
    this.#description = description;
    this.#modality = modality;
    this.#shift = shift;
    this.#imageUrl = imageUrl;
    this.#address = address;
    this.#vacancyCount = vacancyCount;
    this.#workloadHours = workloadHours;
    this.#startDate = startDate;
    this.#endDate = endDate;
    this.#enrollmentStart = enrollmentStart;
    this.#enrollmentEnd = enrollmentEnd;
    this.validate();
  }

  private validate(): void {
    if (!this.#name || this.#name.trim().length === 0) {
      throw new DomainException('O nome do curso é obrigatório.');
    }
    if (!this.#description || this.#description.trim().length === 0) {
      throw new DomainException('A descrição do curso é obrigatória.');
    }
    if (!this.#modality || this.#modality.trim().length === 0) {
      throw new DomainException('A modalidade do curso é obrigatória.');
    }
    if (!this.#shift || this.#shift.trim().length === 0) {
      throw new DomainException('O turno do curso é obrigatório.');
    }
    if (this.#vacancyCount !== undefined && this.#vacancyCount < 1) {
      throw new DomainException('A quantidade de vagas deve ser no mínimo 1.');
    }
    if (this.#workloadHours !== undefined && this.#workloadHours < 1) {
      throw new DomainException('A carga horária deve ser no mínimo 1 hora.');
    }
    if (this.#startDate && this.#endDate && this.#endDate < this.#startDate) {
      throw new DomainException(
        'A data de encerramento não pode ser anterior à data de início.',
      );
    }
    if (
      this.#enrollmentStart &&
      this.#enrollmentEnd &&
      this.#enrollmentEnd < this.#enrollmentStart
    ) {
      throw new DomainException(
        'A data de encerramento das inscrições não pode ser anterior à data de início.',
      );
    }
  }

  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
      description: this.#description,
      modality: this.#modality,
      shift: this.#shift,
      imageUrl: this.#imageUrl ?? null,
      address: this.#address ?? null,
      vacancyCount: this.#vacancyCount ?? null,
      workloadHours: this.#workloadHours ?? null,
      startDate: this.#startDate ?? null,
      endDate: this.#endDate ?? null,
      enrollmentStart: this.#enrollmentStart ?? null,
      enrollmentEnd: this.#enrollmentEnd ?? null,
    };
  }
}
