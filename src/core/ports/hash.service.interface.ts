export const IHashService = Symbol('IHashService');

export interface IHashService {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
