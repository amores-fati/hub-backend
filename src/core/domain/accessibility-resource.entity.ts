import { DomainException } from '../exceptions/domain.exception';
import { AccessibilityResourceType } from './enums/accessibility-resource.enum';

export class AccessibilityResource {
  readonly #id: number;
  readonly #studentId: string;
  #resource: AccessibilityResourceType;

  constructor(
    id: number,
    studentId: string,
    resource: AccessibilityResourceType,
  ) {
    this.#id = id;
    this.#studentId = studentId;
    this.#resource = resource;
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

  public changeResource(newResource: AccessibilityResourceType): void {
    this.#resource = newResource;
    this.validateAccessibilityResource();
  }

  private validateAccessibilityResource(): void {
    if (!this.#studentId || this.#studentId.trim().length === 0) {
      throw new DomainException(
        'O identificador do estudante e obrigatorio para recurso de acessibilidade.',
      );
    }
  }

  toJSON() {
    return {
      id: this.id,
      studentId: this.studentId,
      resource: this.resource,
    };
  }
}
