export const IMailService = Symbol('IMailService');

export interface SendPasswordResetEmailInput {
  to: string;
  resetLink: string;
}

export interface IMailService {
  sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<void>;
}
