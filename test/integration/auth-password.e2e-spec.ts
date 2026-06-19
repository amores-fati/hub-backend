import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { createIntegrationApp } from './bootstrap';
import {
  IMailService,
  SendPasswordResetEmailInput,
} from '../../src/core/ports/mail.service.interface';

const GENERIC_FORGOT_PASSWORD_MESSAGE =
  'Se o e-mail estiver cadastrado, enviaremos as instrucoes para recuperacao de senha.';

describe('Auth password flow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let previousFrontendUrl: string | undefined;
  let previousExpirationMinutes: string | undefined;

  const sentPasswordResetEmails: SendPasswordResetEmailInput[] = [];
  const resetUserId = randomUUID();
  const resetUserEmail = `reset-${Date.now()}@test.com`;
  const resetUserInitialPassword = 'ResetPassword123';
  const resetUserNewPassword = 'ResetPassword456';
  const changeUserId = randomUUID();
  const changeUserEmail = `change-${Date.now()}@test.com`;
  const changeUserInitialPassword = 'ChangePassword123';
  const changeUserNewPassword = 'ChangePassword456';
  const wrongChangeUserId = randomUUID();
  const wrongChangeUserEmail = `wrong-change-${Date.now()}@test.com`;
  const wrongChangeUserPassword = 'WrongChangePassword123';

  const mailService: IMailService = {
    sendPasswordResetEmail: jest.fn(
      async (input: SendPasswordResetEmailInput) => {
        sentPasswordResetEmails.push(input);
      },
    ),
  };

  beforeAll(async () => {
    previousFrontendUrl = process.env.FRONTEND_URL;
    previousExpirationMinutes =
      process.env.RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES;
    process.env.FRONTEND_URL = 'https://frontend.e2e.test';
    process.env.RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES = '30';

    const seed = async (seedDataSource: DataSource) => {
      const resetUserPasswordHash = await bcrypt.hash(
        resetUserInitialPassword,
        10,
      );
      const changeUserPasswordHash = await bcrypt.hash(
        changeUserInitialPassword,
        10,
      );
      const wrongChangeUserPasswordHash = await bcrypt.hash(
        wrongChangeUserPassword,
        10,
      );

      await seedDataSource.query(
        `INSERT INTO "users" (id, email, password_hash, role) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8), ($9, $10, $11, $12)`,
        [
          resetUserId,
          resetUserEmail,
          resetUserPasswordHash,
          'ADMINISTRADOR',
          changeUserId,
          changeUserEmail,
          changeUserPasswordHash,
          'ADMINISTRADOR',
          wrongChangeUserId,
          wrongChangeUserEmail,
          wrongChangeUserPasswordHash,
          'ADMINISTRADOR',
        ],
      );
      await seedDataSource.query(
        `INSERT INTO "admins" (id) VALUES ($1), ($2), ($3)`,
        [resetUserId, changeUserId, wrongChangeUserId],
      );
    };

    app = await createIntegrationApp({
      seed,
      configureTestingModule: (builder) =>
        builder.overrideProvider(IMailService).useValue(mailService),
    });
    dataSource = app.get(DataSource);
  }, 30000);

  afterEach(() => {
    sentPasswordResetEmails.length = 0;
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (previousFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = previousFrontendUrl;
    }

    if (previousExpirationMinutes === undefined) {
      delete process.env.RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES;
    } else {
      process.env.RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES =
        previousExpirationMinutes;
    }

    if (app) {
      await app.close();
    }
  });

  async function requestPasswordResetToken(email: string): Promise<string> {
    await request(app.getHttpServer() as Server)
      .post('/auth/forgot-password')
      .send({ email })
      .expect(200);

    expect(sentPasswordResetEmails).toHaveLength(1);
    const resetLink = sentPasswordResetEmails[0].resetLink;
    const token = new URL(resetLink).searchParams.get('token');

    expect(token).toBeTruthy();

    return token!;
  }

  it('should return the same generic response when email does not exist', async () => {
    await request(app.getHttpServer() as Server)
      .post('/auth/forgot-password')
      .send({ email: 'missing-user@test.com' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          message: GENERIC_FORGOT_PASSWORD_MESSAGE,
        });
      });

    expect(sentPasswordResetEmails).toHaveLength(0);
    expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('should create a reset token and send the reset link when email exists', async () => {
    await request(app.getHttpServer() as Server)
      .post('/auth/forgot-password')
      .send({ email: resetUserEmail })
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          message: GENERIC_FORGOT_PASSWORD_MESSAGE,
        });
      });

    expect(mailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(sentPasswordResetEmails).toHaveLength(1);
    expect(sentPasswordResetEmails[0].to).toBe(resetUserEmail);

    const resetLink = sentPasswordResetEmails[0].resetLink;
    const resetUrl = new URL(resetLink);
    const token = resetUrl.searchParams.get('token');

    expect(resetUrl.origin).toBe('https://frontend.e2e.test');
    expect(resetUrl.pathname).toBe('/reset-password');
    expect(token).toBeTruthy();

    const tokens = (await dataSource.query(
      `SELECT token_hash, used, expires_at FROM "password_reset_tokens" WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [resetUserId],
    )) as Array<{ token_hash: string; used: boolean; expires_at: Date }>;

    expect(tokens).toHaveLength(1);
    expect(tokens[0].token_hash).not.toBe(token);
    expect(tokens[0].used).toBe(false);
    expect(new Date(tokens[0].expires_at).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it('should reset password with a valid token and reject token reuse', async () => {
    const token = await requestPasswordResetToken(resetUserEmail);

    await request(app.getHttpServer() as Server)
      .post('/auth/reset-password')
      .send({ token, newPassword: resetUserNewPassword })
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ message: 'Senha redefinida com sucesso.' });
      });

    await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email: resetUserEmail, password: resetUserInitialPassword })
      .expect(401);

    await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email: resetUserEmail, password: resetUserNewPassword })
      .expect(200)
      .expect((res) => {
        expect((res.body as { accessToken?: string }).accessToken).toBeTruthy();
      });

    const usedTokens = (await dataSource.query(
      `SELECT used, used_at FROM "password_reset_tokens" WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [resetUserId],
    )) as Array<{ used: boolean; used_at: Date | null }>;

    expect(usedTokens).toHaveLength(1);
    expect(usedTokens[0].used).toBe(true);
    expect(usedTokens[0].used_at).toBeTruthy();

    await request(app.getHttpServer() as Server)
      .post('/auth/reset-password')
      .send({ token, newPassword: 'AnotherPassword123' })
      .expect(400)
      .expect((res) => {
        expect(res.body).toMatchObject({
          message: 'Token invalido ou expirado.',
        });
      });
  });

  it('should reject an invalid reset token', () => {
    return request(app.getHttpServer() as Server)
      .post('/auth/reset-password')
      .send({ token: 'invalid-token', newPassword: 'ValidPassword123' })
      .expect(400)
      .expect((res) => {
        expect(res.body).toMatchObject({
          message: 'Token invalido ou expirado.',
        });
      });
  });

  it('should validate reset password payload', () => {
    return request(app.getHttpServer() as Server)
      .post('/auth/reset-password')
      .send({ token: 'any-token', newPassword: 'short' })
      .expect(400)
      .expect((res) => {
        expect((res.body as { message: string[] }).message).toContain(
          'A nova senha deve ter no minimo 8 caracteres',
        );
      });
  });

  it('should change password for an authenticated user', async () => {
    const loginResponse = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({
        email: changeUserEmail,
        password: changeUserInitialPassword,
      })
      .expect(200);

    const accessToken = (loginResponse.body as { accessToken: string })
      .accessToken;

    await request(app.getHttpServer() as Server)
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: changeUserInitialPassword,
        newPassword: changeUserNewPassword,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ message: 'Senha alterada com sucesso.' });
      });

    await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({
        email: changeUserEmail,
        password: changeUserInitialPassword,
      })
      .expect(401);

    await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({
        email: changeUserEmail,
        password: changeUserNewPassword,
      })
      .expect(200);
  });

  it('should reject authenticated password change with wrong current password', async () => {
    const loginResponse = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({
        email: wrongChangeUserEmail,
        password: wrongChangeUserPassword,
      })
      .expect(200);

    const accessToken = (loginResponse.body as { accessToken: string })
      .accessToken;

    await request(app.getHttpServer() as Server)
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'wrong-current-password',
        newPassword: 'AnotherPassword123',
      })
      .expect(401)
      .expect((res) => {
        expect(res.body).toMatchObject({
          message: expect.stringContaining('Credenciais'),
        });
      });
  });
});
