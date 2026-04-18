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
  ASIAN = 'ASIAN',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
  OTHER = 'OTHER',
}

export enum EducationLevel {
  NO_FORMAL_EDUCATION = 'NO_FORMAL_EDUCATION',
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  TECHNICAL = 'TECHNICAL',
  HIGHER = 'HIGHER',
  POSTGRADUATE = 'POSTGRADUATE',
  OTHER = 'OTHER',
}

export enum HowHeardChannel {
  INSTAGRAM = 'INSTAGRAM',
  REFERRAL = 'REFERRAL',
  LINKEDIN = 'LINKEDIN',
  GOOGLE = 'GOOGLE',
  EVENT = 'EVENT',
  OTHER = 'OTHER',
}

export const GENDER_VALUES = Object.values(Gender);
export const RACE_VALUES = Object.values(Race);
export const EDUCATION_LEVEL_VALUES = Object.values(EducationLevel);
export const HOW_HEARD_CHANNEL_VALUES = Object.values(HowHeardChannel);
