import { AppointmentController } from './appointment.controller';

describe('AppointmentController', () => {
  it('passes the receptionist cancellation reason to the service', async () => {
    const appointmentService = {
      cancelByStaff: jest.fn().mockResolvedValue({ id: 'appointment-1' }),
    };
    const controller = new AppointmentController(appointmentService as never);

    await controller.cancel(
      { userId: 'staff-1', roles: ['RECEPTIONIST'] } as never,
      'appointment-1',
      { reason: 'Bệnh nhân yêu cầu hủy' },
    );

    expect(appointmentService.cancelByStaff).toHaveBeenCalledWith(
      'appointment-1',
      'Bệnh nhân yêu cầu hủy',
    );
  });

  it('passes medical-history confirmation and notes to check-in', async () => {
    const appointmentService = { checkInAppointment: jest.fn() };
    const controller = new AppointmentController(appointmentService as never);

    await controller.checkInAppointment('appointment-1', {
      notes: 'Đã đối chiếu',
      medicalHistoryConfirmed: true,
    });

    expect(appointmentService.checkInAppointment).toHaveBeenCalledWith(
      'appointment-1',
      'Đã đối chiếu',
      true,
    );
  });
});
