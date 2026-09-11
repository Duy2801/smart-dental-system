import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppDialogProvider, useAppDialog } from './app-dialog-provider';

function ConfirmAction({ onConfirmed }: { onConfirmed: () => void }) {
  const { showConfirm } = useAppDialog();

  return (
    <button
      type="button"
      onClick={async () => {
        const confirmed = await showConfirm({
          title: 'Hủy buổi tư vấn?',
          description: 'Thao tác này không thể hoàn tác.',
          confirmLabel: 'Hủy buổi tư vấn',
          tone: 'danger',
        });
        if (confirmed) onConfirmed();
      }}
    >
      Mở xác nhận
    </button>
  );
}

describe('AppDialogProvider', () => {
  it('waits for confirmation in an app modal', async () => {
    const onConfirmed = vi.fn();
    render(
      <AppDialogProvider>
        <ConfirmAction onConfirmed={onConfirmed} />
      </AppDialogProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mở xác nhận' }));
    expect(await screen.findByRole('dialog', { name: 'Hủy buổi tư vấn?' })).not.toBeNull();
    expect(onConfirmed).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Hủy buổi tư vấn' }));
    await waitFor(() => expect(onConfirmed).toHaveBeenCalledOnce());
  });
});
