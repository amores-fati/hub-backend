export const ITokenService = Symbol('ITokenService');

export interface ITokenService {
  generate(payload: Record<string, unknown>): string;
}
