import { DomainException } from '../exceptions/domain.exception';
import { AccessibilityResourceType } from './enums/accessibility-resource.enum';

export class AccessibilityResource {
  readonly #id: number;
  readonly #studentId: string;
  #resource: AccessibilityResourceType;
  #resourceOther?: string;

  constructor(
    id: number,
    studentId: string,
    resource: AccessibilityResourceType,
    resourceOther?: string,
  ) {
    this.#id = id;
    this.#studentId = studentId;
    this.#resource = resource;
    this.#resourceOther = resourceOther;
    this.validateAccessibilityResource();
  }

  get id(): number {
    return this.#id;
  }

  get studentId(): string {
    return this.#studentId;
  }

  get resource(): AccessibilityResourceType {
    return this.#resource;
  }

  get resourceOther(): string | undefined {
    return this.#resourceOther;
  }

  public changeResource(
    newResource: AccessibilityResourceType,
    resourceOther?: string,
  ): void {
    this.#resource = newResource;
    this.#resourceOther = resourceOther;
    this.validateAccessibilityResource();
  }

  private validateAccessibilityResource(): void {
    if (!this.#studentId || this.#studentId.trim().length === 0) {
      throw new DomainException(
        'O identificador do estudante Ã© obrigatÃ³rio para recurso de acessibilidade.',
      );
    }

    if (this.#resourceOther && this.#resourceOther.length > 100) {
      throw new DomainException(
        'A descriÃ§Ã£o complementar do recurso nÃ£o pode ter mais que 100 caracteres.',
      );
    }
  }

  toJSON() {
    return {
      id: this.id,
      studentId: this.studentId,
      resource: this.resource,
      resourceOther: this.resourceOther,
    };
  }
}
