import { DomainException } from './domain.exception';

export class SettingNotFoundException extends DomainException {
  constructor(key: string) {
    super(`Configuração não encontrada para a chave: ${key}`);
    this.name = 'SettingNotFoundException';
  }
}
