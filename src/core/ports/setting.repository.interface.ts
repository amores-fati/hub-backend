import { Setting } from '../domain/setting.entity';

export const ISettingRepository = Symbol('ISettingRepository');

export interface ISettingRepository {
  findByKey(key: string): Promise<Setting | null>;
  save(setting: Setting): Promise<Setting>;
}
