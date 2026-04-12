import { DomainException } from '../exceptions/domain.exception';
import { AccessibilityResource } from './accessibility-resource.entity';
import { Contact } from './contact.entity';
import { Disability } from './disability.entity';
import { SocialBenefit } from './social-benefit.entity';
import { User } from './user.entity';

export class Student extends User {
  constructor(
    id: string,
    password: string,
    email: string,
    private readonly _cpf: string,
    private _contact: Contact,
    private _socialName?: string,
    private _birthDate?: Date,
    private _gender?: string,
    private _race?: string,
    private _education?: string,
    private _courseName?: string,
    private _institution?: string,
    private _activityArea?: string,
    private _hasProgrammingExperience?: boolean,
    private _hasTechCourses?: boolean,
    private _techCoursesList?: string,
    private _sendCurriculum: boolean = false,
    private _fatilabMotivation?: string,
    private _howHeard?: string,
    private _hasComputer?: boolean,
    private _hasInternet?: boolean,
    private _committedToParticipate?: boolean,
    private _disability?: Disability,
    private _socialBenefits: SocialBenefit[] = [],
    private _accessibilityResources: AccessibilityResource[] = [],
  ) {
    super(id, email, password);
    this.validateStudent();
  }

  get cpf(): string {
    return this._cpf;
  }

  get contact(): Contact {
    return this._contact;
  }

  get socialName(): string | undefined {
    return this._socialName;
  }

  get birthDate(): Date | undefined {
    return this._birthDate;
  }

  get gender(): string | undefined {
    return this._gender;
  }

  get race(): string | undefined {
    return this._race;
  }

  get education(): string | undefined {
    return this._education;
  }

  get courseName(): string | undefined {
    return this._courseName;
  }

  get institution(): string | undefined {
    return this._institution;
  }

  get activityArea(): string | undefined {
    return this._activityArea;
  }

  get hasProgrammingExperience(): boolean | undefined {
    return this._hasProgrammingExperience;
  }

  get hasTechCourses(): boolean | undefined {
    return this._hasTechCourses;
  }

  get techCoursesList(): string | undefined {
    return this._techCoursesList;
  }

  get sendCurriculum(): boolean {
    return this._sendCurriculum;
  }

  get fatilabMotivation(): string | undefined {
    return this._fatilabMotivation;
  }

  get howHeard(): string | undefined {
    return this._howHeard;
  }

  get hasComputer(): boolean | undefined {
    return this._hasComputer;
  }

  get hasInternet(): boolean | undefined {
    return this._hasInternet;
  }

  get committedToParticipate(): boolean | undefined {
    return this._committedToParticipate;
  }

  get disability(): Disability | undefined {
    return this._disability;
  }

  get socialBenefits(): SocialBenefit[] {
    return this._socialBenefits;
  }

  get accessibilityResources(): AccessibilityResource[] {
    return this._accessibilityResources;
  }

  public changeContact(newContact: Contact): void {
    this._contact = newContact;
    this.validateContact();
  }

  public changeSocialName(newSocialName?: string): void {
    this._socialName = newSocialName;
  }

  public changeAcademicData(data: {
    education?: string;
    courseName?: string;
    institution?: string;
    activityArea?: string;
  }): void {
    if (data.education !== undefined) this._education = data.education;
    if (data.courseName !== undefined) this._courseName = data.courseName;
    if (data.institution !== undefined) this._institution = data.institution;
    if (data.activityArea !== undefined) this._activityArea = data.activityArea;
  }

  public changeTechnologyData(data: {
    hasProgrammingExperience?: boolean;
    hasTechCourses?: boolean;
    techCoursesList?: string;
  }): void {
    if (data.hasProgrammingExperience !== undefined) {
      this._hasProgrammingExperience = data.hasProgrammingExperience;
    }
    if (data.hasTechCourses !== undefined) {
      this._hasTechCourses = data.hasTechCourses;
    }
    if (data.techCoursesList !== undefined) {
      this._techCoursesList = data.techCoursesList;
    }
  }

  public changeParticipationData(data: {
    sendCurriculum?: boolean;
    fatilabMotivation?: string;
    howHeard?: string;
    hasComputer?: boolean;
    hasInternet?: boolean;
    committedToParticipate?: boolean;
  }): void {
    if (data.sendCurriculum !== undefined) {
      this._sendCurriculum = data.sendCurriculum;
    }
    if (data.fatilabMotivation !== undefined) {
      this._fatilabMotivation = data.fatilabMotivation;
    }
    if (data.howHeard !== undefined) {
      this._howHeard = data.howHeard;
    }
    if (data.hasComputer !== undefined) {
      this._hasComputer = data.hasComputer;
    }
    if (data.hasInternet !== undefined) {
      this._hasInternet = data.hasInternet;
    }
    if (data.committedToParticipate !== undefined) {
      this._committedToParticipate = data.committedToParticipate;
    }
  }

  public changeDisability(disability?: Disability): void {
    this._disability = disability;
  }

  public replaceSocialBenefits(benefits: SocialBenefit[]): void {
    this._socialBenefits = benefits;
  }

  public replaceAccessibilityResources(
    resources: AccessibilityResource[],
  ): void {
    this._accessibilityResources = resources;
  }

  private validateStudent(): void {
    this.validateCpf(this._cpf);
    this.validateContact();
    this.validateCollections();
  }

  private validateCpf(cpf: string): void {
    if (!cpf || cpf.trim().length === 0) {
      throw new DomainException('O CPF é obrigatório.');
    }

    if (cpf.length > 14) {
      throw new DomainException('O CPF não pode ter mais que 14 caracteres.');
    }
  }

  private validateContact(): void {
    if (!this._contact || !(this._contact instanceof Contact)) {
      throw new DomainException(
        'Um contato válido e estruturado é obrigatório para o aluno.',
      );
    }
  }

  private validateCollections(): void {
    if (!Array.isArray(this._socialBenefits)) {
      throw new DomainException(
        'Os benefícios sociais devem ser uma lista válida.',
      );
    }

    if (!Array.isArray(this._accessibilityResources)) {
      throw new DomainException(
        'Os recursos de acessibilidade devem ser uma lista válida.',
      );
    }
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      cpf: this.cpf,
      contact: this.contact,
      socialName: this.socialName,
      birthDate: this.birthDate,
      gender: this.gender,
      race: this.race,
      education: this.education,
      courseName: this.courseName,
      institution: this.institution,
      activityArea: this.activityArea,
      hasProgrammingExperience: this.hasProgrammingExperience,
      hasTechCourses: this.hasTechCourses,
      techCoursesList: this.techCoursesList,
      sendCurriculum: this.sendCurriculum,
      fatilabMotivation: this.fatilabMotivation,
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