import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminInput, AdminSelect } from './admin-field';

describe('admin form fields', () => {
  it('marks only required fields with an asterisk', () => {
    render(
      <>
        <AdminInput label="Tên dịch vụ" required />
        <AdminInput label="Ghi chú" />
        <AdminSelect label="Trạng thái" required>
          <option value="ACTIVE">Hoạt động</option>
        </AdminSelect>
      </>,
    );

    expect(within(screen.getByText('Tên dịch vụ').closest('label')!).getByText('*')).not.toBeNull();
    expect(within(screen.getByText('Trạng thái').closest('label')!).getByText('*')).not.toBeNull();
    expect(within(screen.getByText('Ghi chú').closest('label')!).queryByText('*')).toBeNull();
  });
});
