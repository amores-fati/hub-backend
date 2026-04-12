import { AccessibilityResourceType } from '../domain/enums/accessibility-resource.enum';

export interface CreateAccessibilityResourceCommand {
  resource: AccessibilityResourceType;
  resourceOther?: string;
}

export type UpdateAccessibilityResourceCommand =
  CreateAccessibilityResourceCommand;

export type PatchAccessibilityResourceCommand =
  Partial<CreateAccessibilityResourceCommand>;
