import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import {
  IMailService,
  SendPasswordResetEmailInput,
} from '../../../core/ports/mail.service.interface';

@Injectable()
export class NodemailerMailService implements IMailService {
  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail({
    to,
    resetLink,
  }: SendPasswordResetEmailInput): Promise<void> {
    const port = Number(this.configService.get<string>('SMTP_PORT', '587'));
    const transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('SMTP_HOST'),
      port,
      secure: port === 465,
      auth: {
        user: this.configService.getOrThrow<string>('SMTP_USER'),
        pass: this.configService.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });

    await transporter.sendMail({
      from: this.configService.getOrThrow<string>('EMAIL_FROM'),
      to,
      subject: 'Recuperacao de senha',
      text: [
        'Ola,',
        '',
        'Recebemos uma solicitacao para redefinir sua senha.',
        '',
        'Acesse o link abaixo para criar uma nova senha:',
        resetLink,
        '',
        'Este link e temporario.',
        '',
        'Se voce nao solicitou essa recuperacao, ignore este email.',
      ].join('\n'),
      html: `
        <p>Ola,</p>
        <p>Recebemos uma solicitacao para redefinir sua senha.</p>
        <p><a href="${resetLink}">Clique aqui para criar uma nova senha</a></p>
        <p>Este link e temporario.</p>
        <p>Se voce nao solicitou essa recuperacao, ignore este email.</p>
      `,
    });
  }
}
