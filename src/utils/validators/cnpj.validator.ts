import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { cnpj } from 'cpf-cnpj-validator';

@ValidatorConstraint({ async: false })
export class IsCnpjConstraint implements ValidatorConstraintInterface {
  validate(cnpjValue: string): boolean {
    if (!cnpjValue || typeof cnpjValue !== 'string') return false;

    return cnpj.isValid(cnpjValue);
  }

  defaultMessage(): string {
    return 'O CNPJ informado possui um formato inválido ou não existe.';
  }
}

export function IsCnpj(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCnpjConstraint,
    });
  };
}
