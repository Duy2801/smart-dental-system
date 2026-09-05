import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '@/src/lib/api/client';
import { TimeOffModal } from './TimeOffModal';

vi.mock('@/src/lib/api/client', () => ({
  default: { post: vi.fn() },
}));

describe('TimeOffModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 5, 22, 0, 0));
  });

  afterEach(() => vi.useRealTimers());

  it('does not submit a same-day time-off request whose start time has passed', () => {
    const { container } = render(
      <TimeOffModal doctorId="doctor-1" onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    const inputs = container.querySelectorAll('input');

    fireEvent.change(inputs[2], { target: { value: '08:00' } });
    fireEvent.change(inputs[3], { target: { value: '17:00' } });
    fireEvent.change(container.querySelector('textarea')!, {
      target: { value: 'Việc cá nhân' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));

    expect(screen.getByText('Thời gian bắt đầu nghỉ phải ở tương lai.')).not.toBeNull();
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
