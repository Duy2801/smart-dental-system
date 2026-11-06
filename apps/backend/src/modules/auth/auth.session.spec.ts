import 'reflect-metadata';
import { AuthService } from './auth.service';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await -- focused unit-test doubles intentionally mimic framework services */

describe('AuthService multi-session refresh tokens', () => {
  it('keeps two sessions for the same user refreshable independently', async () => {
    const store = new Map<string, string>();
    const jwt = {
      sign: jest.fn((payload: object) => JSON.stringify(payload)),
      verify: jest.fn((token: string) => JSON.parse(token)),
    };
    const redis = {
      set: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      del: jest.fn(async (key: string) => {
        store.delete(key);
      }),
      delByPrefix: jest.fn(),
    };
    const prisma = {
      user: {
        findUnique: jest.fn(async () => ({
          id: 'user-1',
          email: 'doctor@example.com',
          roles: [],
          role: { code: 'DOCTOR' },
          doctorProfile: null,
        })),
      },
    };
    const config = { getOrThrow: jest.fn(() => 'test-secret') };
    const service = new AuthService(
      {} as never,
      jwt as never,
      redis as never,
      config as never,
      prisma as never,
      {} as never,
      {} as never,
    );
    jest.spyOn(service, 'me').mockResolvedValue({ id: 'user-1' } as never);

    const createSession = (
      service as unknown as {
        createSession(user: { id: string; email: string }): Promise<{
          accessToken: string;
          refreshToken: string;
        }>;
      }
    ).createSession.bind(service);

    const first = await createSession({
      id: 'user-1',
      email: 'doctor@example.com',
    });
    const second = await createSession({
      id: 'user-1',
      email: 'doctor@example.com',
    });

    expect(first.refreshToken).not.toBe(second.refreshToken);
    expect([...store.keys()]).toHaveLength(2);
    await expect(
      service.refreshToken('user-1', first.refreshToken),
    ).resolves.toHaveProperty('accessToken');
    await expect(
      service.refreshToken('user-1', second.refreshToken),
    ).resolves.toHaveProperty('accessToken');
  });

  it('slides the refresh session, tolerates concurrent refreshes and honours logout', async () => {
    const store = new Map<string, string>();
    let counter = 0;
    const jwt = {
      // Mỗi lần ký ra token khác nhau (giống JWT thật có iat/exp mới)
      sign: jest.fn((payload: object) =>
        JSON.stringify({ ...payload, n: ++counter }),
      ),
      verify: jest.fn((token: string) => JSON.parse(token)),
    };
    const redis = {
      set: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      del: jest.fn(async (key: string) => {
        store.delete(key);
      }),
      delByPrefix: jest.fn(),
    };
    const prisma = {
      user: {
        findUnique: jest.fn(async () => ({
          id: 'user-1',
          email: 'patient@example.com',
          role: { code: 'PATIENT' },
          doctorProfile: null,
        })),
      },
    };
    const config = { getOrThrow: jest.fn(() => 'test-secret') };
    const service = new AuthService(
      {} as never,
      jwt as never,
      redis as never,
      config as never,
      prisma as never,
      {} as never,
      {} as never,
    );
    jest.spyOn(service, 'me').mockResolvedValue({ id: 'user-1' } as never);
    const createSession = (
      service as unknown as {
        createSession(user: { id: string; email: string }): Promise<{
          refreshToken: string;
        }>;
      }
    ).createSession.bind(service);

    const session = await createSession({ id: 'user-1', email: 'patient@example.com' });
    const original = session.refreshToken;

    // Lần refresh đầu: cấp refresh token mới (gia hạn 7 ngày)
    const firstRefresh = await service.refreshToken('user-1', original);
    expect(firstRefresh.refreshToken).not.toBe(original);

    // Tab khác gửi token cũ ngay sau đó: vẫn được, nhận token mới nhất, không bị đăng xuất
    const concurrent = await service.refreshToken('user-1', original);
    expect(concurrent.refreshToken).toBe(firstRefresh.refreshToken);

    // Token mới tiếp tục dùng được
    await expect(
      service.refreshToken('user-1', firstRefresh.refreshToken),
    ).resolves.toHaveProperty('accessToken');

    // Đăng xuất: mọi token của phiên đều hết hiệu lực
    const sid = JSON.parse(original).sid as string;
    await service.logout('user-1', sid);
    await expect(service.refreshToken('user-1', original)).rejects.toThrow();
    await expect(
      service.refreshToken('user-1', firstRefresh.refreshToken),
    ).rejects.toThrow();
  });
});
