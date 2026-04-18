import { DomainException } from '../exceptions/domain.exception';
import { AccessibilityResource } from './accessibility-resource.entity';
import { Contact } from './contact.entity';
import { Disability } from './disability.entity';
import {
  EducationLevel,
  EDUCATION_LEVEL_VALUES,
  Gender,
  GENDER_VALUES,
  HowHeardChannel,
  HOW_HEARD_CHANNEL_VALUES,
  Race,
  RACE_VALUES,
} from './enums/student-profile.enum';
import { SocialBenefit } from './social-benefit.entity';
import { User } from './user.entity';

export class Student extends User {
  readonly #cpf: string;
  #contact: Contact;
  #birthDate: Date;
  #gender: Gender;
  #race: Race;
  #education?: EducationLevel;
  #institution?: string;
  #activityArea?: string;
  #hasProgrammingExperience?: boolean;
  #hasTechnologyCourse?: boolean;
  #sendCurriculum: boolean;
  #motivation?: string;
  #howHeard?: HowHeardChannel;
  #hasComputer?: boolean;
  #hasInternet?: boolean;
  #committedToParticipate?: boolean;
  #disability?: Disability;
  #socialBenefits: SocialBenefit[];
  #accessibilityResources: AccessibilityResource[];

  constructor(
    id: string,
    password: string,
    email: string,
    cpf: string,
    contact: Contact,
    birthDate: Date | string,
    gender: Gender,
    race: Race,
    education?: EducationLevel,
    institution?: string,
    activityArea?: string,
    hasProgrammingExperience?: boolean,
    hasTechnologyCourse?: boolean,
    sendCurriculum: boolean = false,
    motivation?: string,
    howHeard?: HowHeardChannel,
    hasComputer?: boolean,
    hasInternet?: boolean,
    committedToParticipate?: boolean,
    disability?: Disability,
    socialBenefits: SocialBenefit[] = [],
    accessibilityResources: AccessibilityResource[] = [],
  ) {
    super(id, email, password);
    this.#cpf = cpf;
    this.#contact = contact;
    this.#birthDate = birthDate instanceof Date ? birthDate : new Date(birthDate);
    this.#gender = gender;
    this.#race = race;
    this.#education = education;
    this.#institution = institution;
    this.#activityArea = activityArea;
    this.#hasProgrammingExperience = hasProgrammingExperience;
    this.#hasTechnologyCourse = hasTechnologyCourse;
    this.#sendCurriculum = sendCurriculum;
    this.#motivation = motivation;
    this.#howHeard = howHeard;
    this.#hasComputer = hasComputer;
    this.#hasInternet = hasInternet;
    this.#committedToParticipate = committedToParticipate;
    this.#disability = disability;
    this.#socialBenefits = socialBenefits;
    this.#accessibilityResources = accessibilityResources;
    this.validateStudent();
  }

  get cpf(): string {
    return this.#cpf;
  }

  get contact(): Contact {
    return this.#contact;
  }


  get birthDate(): Date {
    return this.#birthDate;
  }

  get gender(): Gender {
    return this.#gender;
  }

  get race(): Race {
    return this.#race;
  }

  get education(): EducationLevel | undefined {
    return this.#education;
  }


  get institution(): string | undefined {
    return this.#institution;
  }

  get activityArea(): string | undefined {
    return this.#activityArea;
  }

  get hasProgrammingExperience(): boolean | undefined {
    return this.#hasProgrammingExperience;
  }

  get hasTechnologyCourse(): boolean | undefined {
    return this.#hasTechnologyCourse;
  }


  get sendCurriculum(): boolean {
    return this.#sendCurriculum;
  }

  get motivation(): string | undefined {
    return this.#motivation;
  }

  get howHeard(): HowHeardChannel | undefined {
    return this.#howHeard;
  }

  get hasComputer(): boolean | undefined {
    return this.#hasComputer;
  }

  get hasInternet(): boolean | undefined {
    return this.#hasInternet;
  }

  get committedToParticipate(): boolean | undefined {
    return this.#committedToParticipate;
  }

  get disability(): Disability | undefined {
    return this.#disability;
  }

  get socialBenefits(): SocialBenefit[] {
    return this.#socialBenefits;
  }

  get accessibilityResources(): AccessibilityResource[] {
    return this.#accessibilityResources;
  }

  public changeContact(newContact: Contact): void {
    this.#contact = newContact;
    this.validateContact();
  }


  public changeProfileData(data: {
    birthDate?: Date;
    gender?: Gender;
    race?: Race;
  }): void {
    if (data.birthDate !== undefined) this.#birthDate = data.birthDate;
    if (data.gender !== undefined) this.#gender = data.gender;
    if (data.race !== undefined) this.#race = data.race;
    this.validateProfileData();
  }



  public changeParticipationData(data: {
    sendCurriculum?: boolean;
    motivation?: string;
    howHeard?: HowHeardChannel;
    hasComputer?: boolean;
    hasInternet?: boolean;
    committedToParticipate?: boolean;
  }): void {
    if (data.sendCurriculum !== undefined) {
      this.#sendCurriculum = data.sendCurriculum;
    }
    if (data.motivation !== undefined) {
      this.#motivation = data.motivation;
    }
    if (data.howHeard !== undefined) {
      this.#howHeard = data.howHeard;
    }
    if (data.hasComputer !== undefined) {
      this.#hasComputer = data.hasComputer;
    }
    if (data.hasInternet !== undefined) {
      this.#hasInternet = data.hasInternet;
    }
    if (data.committedToParticipate !== undefined) {
      this.#committedToParticipate = data.committedToParticipate;
    }
    this.validateControlledValues();
  }

  public changeDisability(disability?: Disability): void {
    this.#disability = disability;
  }

  public replaceSocialBenefits(benefits: SocialBenefit[]): void {
    this.#socialBenefits = benefits;
  }

  public replaceAccessibilityResources(
    resources: AccessibilityResource[],
  ): void {
    this.#accessibilityResources = resources;
  }

  private validateStudent(): void {
    this.validateCpf(this.#cpf);
    this.validateContact();
    this.validateProfileData();
    this.validateControlledValues();
    this.validateCollections();
  }

  private validateCpf(cpf: string): void {
    if (!cpf || cpf.trim().length === 0) {
      throw new DomainException('O CPF e obrigatorio.');
    }

    if (cpf.length > 14) {
      throw new DomainException('O CPF nao pode ter mais que 14 caracteres.');
    }
  }

  private validateContact(): void {
    if (!this.#contact || !(this.#contact instanceof Contact)) {
      throw new DomainException(
        'Um contato valido e estruturado e obrigatorio para o aluno.',
      );
    }
  }

  private validateProfileData(): void {
    if (!this.#birthDate || Number.isNaN(this.#birthDate.getTime())) {
      throw new DomainException('A data de nascimento informada e invalida.');
    }

    this.validateRequiredEnum('genero', this.#gender, GENDER_VALUES);
    this.validateRequiredEnum('raca', this.#race, RACE_VALUES);
  }

  private validateControlledValues(): void {
    this.validateOptionalEnum(
      'escolaridade',
      this.#education,
      EDUCATION_LEVEL_VALUES,
    );
    this.validateOptionalEnum(
      'canal de origem',
      this.#howHeard,
      HOW_HEARD_CHANNEL_VALUES,
    );
  }

  private validateOptionalEnum<T extends string>(
    label: string,
    value: T | undefined,
    allowedValues: readonly T[],
  ): void {
    if (!value) {
      return;
    }

    if (!allowedValues.includes(value)) {
      throw new DomainException(`O valor informado para ${label} e invalido.`);
    }
  }

  private validateRequiredEnum<T extends string>(
    label: string,
    value: T | undefined,
    allowedValues: readonly T[],
  ): void {
    if (!value) {
      throw new DomainException(`O campo ${label} e obrigatorio.`);
    }

    this.validateOptionalEnum(label, value, allowedValues);
  }

  private validateCollections(): void {
    if (!Array.isArray(this.#socialBenefits)) {
      throw new DomainException(
        'Os beneficios sociais devem ser uma lista valida.',
      );
    }

    if (!Array.isArray(this.#accessibilityResources)) {
      throw new DomainException(
        'Os recursos de acessibilidade devem ser uma lista valida.',
      );
    }
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      cpf: this.cpf,
      contact: this.contact,
      birthDate: this.birthDate,
      gender: this.gender,
      race: this.race,
      education: this.education,
      institution: this.institution,
      activityArea: this.activityArea,
      hasProgrammingExperience: this.hasProgrammingExperience,
      hasTechnologyCourse: this.hasTechnologyCourse,
      sendCurriculum: this.sendCurriculum,
      motivation: this.motivation,
      howHeard: this.howHeard,
      hasComputer: this.hasComputer,
      hasInternet: this.hasInternet,
      committedToParticipate: this.committedToParticipate,
      disability: this.disability,
      socialBenefits: this.socialBenefits,
      accessibilityResources: this.accessibilityResources,
    };
  }
}
