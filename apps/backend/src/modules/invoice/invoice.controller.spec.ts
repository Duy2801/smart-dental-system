import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { InvoiceController } from './invoice.controller';

describe('InvoiceController authorization', () => {
  it('only exposes invoice listings to authenticated receptionist or admin users', () => {
    expect(Reflect.getMetadata(ROLES_KEY, InvoiceController)).toEqual([
      'RECEPTIONIST',
      'ADMIN',
    ]);
    expect(Reflect.getMetadata(GUARDS_METADATA, InvoiceController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
  });
});
