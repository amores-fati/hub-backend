import { AccessibilityResourceType } from '../domain/enums/accessibility-resource.enum';

export interface CreateAccessibilityResourceCommand {
  resource: AccessibilityResourceType;
}

export type UpdateAccessibilityResourceCommand =
  CreateAccessibilityResourceCommand;

export type PatchAccessibilityResourceCommand =
  Partial<CreateAccessibilityResourceCommand>;
