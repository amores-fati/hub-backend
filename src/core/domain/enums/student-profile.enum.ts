export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NON_BINARY = 'NON_BINARY',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
  OTHER = 'OTHER',
}

export enum Race {
  WHITE = 'WHITE',
  BLACK = 'BLACK',
  BROWN = 'BROWN',
  INDIGENOUS = 'INDIGENOUS',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum EducationLevel {
  NO_EDUCATION = 'NO_EDUCATION',
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  HIGHER = 'HIGHER',
  POSTGRADUATE = 'POSTGRADUATE',
}

export enum HowHeardChannel {
  INSTAGRAM = 'INSTAGRAM',
  REFEREE = 'REFEREE',
  LINKEDIN = 'LINKEDIN',
  OTHERS = 'OTHERS',
}

export enum FamilyIncome {
  TO1_SALARY = 'TO1_SALARY',
  BETWEEN_1_3 = 'BETWEEN_1_3',
  MORE_THAN_3 = 'MORE_THAN_3',
}

export const GENDER_VALUES = Object.values(Gender);
export const RACE_VALUES = Object.values(Race);
export const EDUCATION_LEVEL_VALUES = Object.values(EducationLevel);
export const HOW_HEARD_CHANNEL_VALUES = Object.values(HowHeardChannel);
export const FAMILY_INCOME_VALUES = Object.values(FamilyIncome);
