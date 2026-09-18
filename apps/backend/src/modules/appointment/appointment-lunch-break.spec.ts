import { AppointmentService } from './appointment.service';

describe('AppointmentService lunch break slots', () => {
  const service = new AppointmentService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  it('removes every service slot that overlaps the clinic lunch break', async () => {
    const slots = await (
      service as unknown as {
        buildTimeSlots(input: unknown): Promise<string[]>;
      }
    ).buildTimeSlots({
      dateId: '2099-09-14',
      serviceDurationMinutes: 60,
      doctors: [{ id: 'doctor-1' }],
      businessHours: [
        {
          id: 1,
          label: 'Thứ Hai',
          isOpen: true,
          start: '08:00',
          end: '17:00',
        },
      ],
      specialDates: [],
      lunchBreak: { isEnabled: true, start: '12:00', end: '13:30' },
      slotIntervalMinutes: 30,
      recordsByDoctor: new Map([
        [
          'doctor-1',
          [
            {
              recordType: 'WEEKLY',
              dayOfWeek: 1,
              specificDateStr: null,
              startMin: 8 * 60,
              endMin: 17 * 60,
            },
          ],
        ],
      ]),
      appointmentsByDoctor: new Map(),
    });

    expect(slots).toContain('11:00');
    expect(slots).not.toContain('11:30');
    expect(slots).not.toContain('12:00');
    expect(slots).not.toContain('13:00');
    expect(slots).toContain('13:30');
  });
});
