import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WeekCalendar } from './WeekCalendar';

describe('WeekCalendar time-off deletion', () => {
  it('asks for confirmation in an app modal before deleting', async () => {
    const onDeleteTimeOff = vi.fn().mockResolvedValue(undefined);

    render(
      <WeekCalendar
        weekDays={[
          { iso: '2026-09-05', date: '05-09', day: 'Thứ 7', isToday: true },
        ]}
        appointments={[]}
        timeOffs={[
          {
            id: 'time-off-1',
            dayIso: '2026-09-05',
            startTime: '08:00',
            endTime: '17:00',
            reason: 'Việc cá nhân',
            approvalStatus: 'PENDING',
          },
        ]}
        loading={false}
        onStatusChange={vi.fn()}
        onDeleteTimeOff={onDeleteTimeOff}
      />,
    );

    fireEvent.click(screen.getByTitle('Xóa nghỉ'));

    expect(screen.getByRole('dialog', { name: 'Xóa đăng ký nghỉ?' })).not.toBeNull();
    expect(onDeleteTimeOff).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Xóa ngày nghỉ' }));

    await waitFor(() => expect(onDeleteTimeOff).toHaveBeenCalledWith('time-off-1'));
  });

  it('shows the approval status of a time-off request', () => {
    render(
      <WeekCalendar
        weekDays={[
          { iso: '2026-09-05', date: '05-09', day: 'Thứ 7', isToday: true },
        ]}
        appointments={[]}
        timeOffs={[
          {
            id: 'pending-time-off',
            dayIso: '2026-09-05',
            startTime: '08:00',
            endTime: '17:00',
            reason: 'Việc cá nhân',
            approvalStatus: 'PENDING',
          },
        ]}
        loading={false}
        onStatusChange={vi.fn()}
        onDeleteTimeOff={vi.fn()}
      />,
    );

    expect(screen.getByText('Chờ duyệt')).not.toBeNull();
  });
});
