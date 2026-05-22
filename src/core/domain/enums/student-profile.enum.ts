export enum Gender {
  MALE = 'MASCULINO',
  FEMALE = 'FEMININO',
  NON_BINARY = 'NAO_BINARIO',
  PREFER_NOT_TO_SAY = 'PREFIRO_NAO_DIZER',
  OTHER = 'OUTRO',
}

export enum Race {
  WHITE = 'BRANCO',
  BLACK = 'PRETO',
  BROWN = 'PARDO',
  INDIGENOUS = 'INDIGENA',
  PREFER_NOT_TO_SAY = 'PREFIRO_NAO_DIZER',
}

export enum EducationLevel {
  NO_EDUCATION = 'SEM_ESCOLARIDADE',
  PRIMARY = 'FUNDAMENTAL',
  SECONDARY = 'MEDIO',
  HIGHER = 'SUPERIOR',
  POSTGRADUATE = 'POS_GRADUACAO',
}

export enum HowHeardChannel {
  INSTAGRAM = 'INSTAGRAM',
  REFEREE = 'INDICACAO',
  LINKEDIN = 'LINKEDIN',
  OTHERS = 'OUTROS',
}

export enum FamilyIncome {
  TO1_SALARY = 'ATE_1_SALARIO',
  BETWEEN_1_3 = 'ENTRE_1_E_3',
  MORE_THAN_3 = 'MAIS_DE_3',
}

export const GENDER_VALUES = Object.values(Gender);
export const RACE_VALUES = Object.values(Race);
export const EDUCATION_LEVEL_VALUES = Object.values(EducationLevel);
export const HOW_HEARD_CHANNEL_VALUES = Object.values(HowHeardChannel);
export const FAMILY_INCOME_VALUES = Object.values(FamilyIncome);
