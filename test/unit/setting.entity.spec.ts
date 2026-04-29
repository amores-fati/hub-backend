import { Setting } from '../../src/core/domain/setting.entity';
import { DomainException } from '../../src/core/exceptions/domain.exception';

describe('Setting Entity', () => {
  it('should create a valid setting', () => {
    const setting = new Setting('1', 'key', 'value');
    expect(setting.id).toBe('1');
    expect(setting.key).toBe('key');
    expect(setting.value).toBe('value');
  });

  it('should throw an error if ID is missing', () => {
    expect(() => new Setting('', 'key', 'value')).toThrow(DomainException);
    expect(() => new Setting('', 'key', 'value')).toThrow(
      'O ID da configuração é obrigatório.',
    );
  });

  it('should throw an error if key is missing', () => {
    expect(() => new Setting('1', '', 'value')).toThrow(DomainException);
    expect(() => new Setting('1', '', 'value')).toThrow(
      'A chave da configuração é obrigatória.',
    );
  });

  it('should throw an error if value is missing', () => {
    expect(() => new Setting('1', 'key', null as unknown as string)).toThrow(
      DomainException,
    );
    expect(() => new Setting('1', 'key', null as unknown as string)).toThrow(
      'O valor da configuração é obrigatório.',
    );
  });

  it('should return a JSON representation', () => {
    const setting = new Setting('1', 'key', 'value');
    expect(setting.toJSON()).toEqual({
      id: '1',
      key: 'key',
      value: 'value',
    });
  });
});
