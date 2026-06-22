import { randomUUID } from 'crypto';
import { ISettingRepository } from '../ports/setting.repository.interface';
import { SettingNotFoundException } from '../exceptions/setting-not-found.exception';
import { Setting } from '../domain/setting.entity';

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

  async updateSettingByKey(key: string, value: string) {
    let setting = await this.settingRepository.findByKey(key);
    if (!setting) {
      setting = new Setting(randomUUID(), key, value);
    } else {
      setting.updateValue(value);
    }
    const saved = await this.settingRepository.save(setting);
    return {
      key: saved.key,
      value: saved.value,
    };
  }
}
