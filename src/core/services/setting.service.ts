import { ISettingRepository } from '../ports/setting.repository.interface';
import { SettingNotFoundException } from '../exceptions/setting-not-found.exception';

export class SettingService {
  constructor(private readonly settingRepository: ISettingRepository) {}

  async getSettingByKey(key: string) {
    const setting = await this.settingRepository.findByKey(key);
    if (!setting) {
      throw new SettingNotFoundException(key);
    }
    return {
      key: setting.key,
      value: setting.value,
    };
  }
}
