import { sanitizeResponse } from './sanitize-response';

describe('sanitizeResponse', () => {
  it('removes passwordHash at any depth, keeps other fields', () => {
    const input = {
      id: 'apt-1',
      doctor: { user: { fullName: 'BS A', passwordHash: 'hash-doc' } },
      patient: { user: { fullName: 'BN B', email: 'b@x.com', passwordHash: 'hash-pat' } },
      list: [{ user: { passwordHash: 'h', phone: '090' } }],
    };

    const out = sanitizeResponse(input);

    expect(JSON.stringify(out)).not.toContain('hash-');
    expect(out.doctor.user).toEqual({ fullName: 'BS A' });
    expect(out.patient.user).toEqual({ fullName: 'BN B', email: 'b@x.com' });
    expect(out.list[0].user).toEqual({ phone: '090' });
    // không sửa object gốc
    expect(input.doctor.user.passwordHash).toBe('hash-doc');
  });

  it('keeps Date and class instances (e.g. Prisma Decimal) untouched', () => {
    class Decimal {
      constructor(public value: string) {}
      toJSON() {
        return this.value;
      }
    }
    const date = new Date('2026-11-15T01:00:00Z');
    const price = new Decimal('700000');
    const out = sanitizeResponse({ scheduledAt: date, price });
    expect(out.scheduledAt).toBe(date);
    expect(out.price).toBe(price);
  });

  it('handles primitives and circular references', () => {
    expect(sanitizeResponse('x')).toBe('x');
    const a: Record<string, unknown> = { passwordHash: 'h' };
    a.self = a;
    const out = sanitizeResponse(a) as Record<string, unknown>;
    expect(out.passwordHash).toBeUndefined();
    expect(out.self).toBe(out);
  });
});
