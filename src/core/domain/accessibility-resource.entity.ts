import { DomainException } from '../exceptions/domain.exception';
import { AccessibilityResourceType } from './enums/accessibility-resource.enum';

export class AccessibilityResource {
  constructor(
    private readonly _id: number,
    private readonly _studentId: string,
    private _resource: AccessibilityResourceType,
    private _resourceOther?: string,
  ) {
    this.validateAccessibilityResource();
  }

  get id(): number {
    return this._id;
  }

  get studentId(): string {
    return this._studentId;
  }

  get resource(): AccessibilityResourceType {
    return this._resource;
  }

  get resourceOther(): string | undefined {
    return this._resourceOther;
  }

  public changeResource(
    newResource: AccessibilityResourceType,
    resourceOther?: string,
  ): void {
    this._resource = newResource;
    this._resourceOther = resourceOther;
    this.validateAccessibilityResource();
  }

  private validateAccessibilityResource(): void {
    if (!this._studentId || this._studentId.trim().length === 0) {
      throw new DomainException(
        'O identificador do estudante é obrigatório para recurso de acessibilidade.',
      );
    }

    if (this._resourceOther && this._resourceOther.length > 100) {
      throw new DomainException(
        'A descrição complementar do recurso não pode ter mais que 100 caracteres.',
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
