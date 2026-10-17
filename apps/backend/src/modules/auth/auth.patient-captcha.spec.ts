import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService patient-only CAPTCHA', () => {
  const makeService = (role: string) => {
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: bcrypt.hashSync('correct-password', 4),
      status: 'ACTIVE',
      emailVerified: true,
      role: { code: role },
      googleId: 'google-user-1',
    };
    const userService = { findByEmail: jest.fn().mockResolvedValue(user) };
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(user),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    const captcha = { verify: jest.fn().mockResolvedValue(undefined) };
    const service = new AuthService(
      userService as never,
      {} as never,
      {} as never,
      {} as never,
      prisma as never,
      {} as never,
      captcha as never,
    );
    jest.spyOn(service as never, 'createSession').mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    } as never);
    return { service, captcha, prisma, user };
  };

  it('requires CAPTCHA for a patient before checking the password', async () => {
    const { service, captcha } = makeService('PATIENT');
    captcha.verify.mockRejectedValue(new Error('captcha_required'));

    await expect(service.login('user@example.com', 'wrong-password')).rejects.toThrow(
      'captcha_required',
    );
    expect(captcha.verify).toHaveBeenCalledWith(undefined);
  });

  it.each(['DOCTOR', 'RECEPTIONIST', 'ADMIN'])(
    'lets %s log in with a password without CAPTCHA',
    async (role) => {
      const { service, captcha } = makeService(role);

      await expect(
        service.login('user@example.com', 'correct-password'),
      ).resolves.toHaveProperty('accessToken');
      expect(captcha.verify).not.toHaveBeenCalled();
    },
  );

  it('lets an existing Google patient log in without CAPTCHA', async () => {
    const { service, captcha } = makeService('PATIENT');
    jest.spyOn(service as never, 'verifyGoogleToken').mockResolvedValue({
      sub: 'google-user-1',
      email: 'user@example.com',
    } as never);
    jest.spyOn(service as never, 'ensurePatientProfile').mockResolvedValue(undefined as never);

    await expect(service.loginWithGoogle('google-token')).resolves.toHaveProperty(
      'accessToken',
    );
    expect(captcha.verify).not.toHaveBeenCalled();
  });

  it('lets an existing Google staff account log in without CAPTCHA', async () => {
    const { service, captcha } = makeService('DOCTOR');
    jest.spyOn(service as never, 'verifyGoogleToken').mockResolvedValue({
      sub: 'google-user-1',
      email: 'user@example.com',
    } as never);

    await expect(service.loginWithGoogle('google-token')).resolves.toHaveProperty(
      'accessToken',
    );
    expect(captcha.verify).not.toHaveBeenCalled();
  });

  it('lets a new Google patient sign in without CAPTCHA', async () => {
    const { service, captcha, prisma } = makeService('PATIENT');
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'new-user',
      email: 'new@example.com',
      status: 'ACTIVE',
      role: { code: 'PATIENT' },
    });
    jest.spyOn(service as never, 'verifyGoogleToken').mockResolvedValue({
      sub: 'new-google-user',
      email: 'new@example.com',
    } as never);
    jest.spyOn(service as never, 'getPatientRole').mockResolvedValue({ id: 'patient-role' } as never);
    jest.spyOn(service as never, 'ensurePatientProfile').mockResolvedValue(undefined as never);

    await expect(service.loginWithGoogle('google-token')).resolves.toHaveProperty(
      'accessToken',
    );
    expect(prisma.user.create).toHaveBeenCalled();
    expect(captcha.verify).not.toHaveBeenCalled();
  });
});
