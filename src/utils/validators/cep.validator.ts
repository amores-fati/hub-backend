import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsCepConstraint implements ValidatorConstraintInterface {
  validate(cepValue: string): boolean {
    if (!cepValue || typeof cepValue !== 'string') return false;

    const unmaskedCep = cepValue.replace(/\D/g, '');

    return unmaskedCep.length === 8;
  }

  defaultMessage(): string {
    return 'O CEP informado possui um formato inválido. Utilize 8 dígitos numéricos (ex: 01310100 ou 01310-100).';
  }
}

export function IsCep(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCepConstraint,
    });
  };
}
