import { PATH_METADATA } from '@nestjs/common/constants';
import { RefundController } from './refund.controller';

describe('RefundController routes', () => {
  it('exposes refund requests through the admin API used by staff frontend', () => {
    expect(Reflect.getMetadata(PATH_METADATA, RefundController)).toContain(
      'admin/refund-requests',
    );
  });
});
