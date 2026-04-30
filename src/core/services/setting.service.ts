import { Setting } from '../domain/setting.entity';
import { ISettingRepository } from '../ports/setting.repository.interface';

export class SettingService {
  constructor(private readonly settingRepository: ISettingRepository) {}

  async getPublicSetting(key: string): Promise<Setting | null> {
    return this.settingRepository.findByKey(key);
  }
}
