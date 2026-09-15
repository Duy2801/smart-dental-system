import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ChatbotConversationController } from './chatbot-conversation.controller';

describe('internal chatbot service boundary', () => {
  it.each([
    'getServicesInternal',
    'getDoctorsInternal',
    'getPatientsInternal',
    'createPatientInternal',
    'getSlotsInternal',
    'getAppointmentsInternal',
    'bookInternal',
  ])('protects %s with the service-key guard', (method) => {
    const guards =
      Reflect.getMetadata(
        GUARDS_METADATA,
        ChatbotConversationController.prototype[method],
      ) || [];
    expect(
      guards.some((guard) => guard.name === 'ChatbotServiceKeyGuard'),
    ).toBe(true);
  });
});
