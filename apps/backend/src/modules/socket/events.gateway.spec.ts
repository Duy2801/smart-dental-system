import { EventsGateway, supportConversationRoom } from './events.gateway';

describe('EventsGateway support rooms', () => {
  const conversationId = 'conversation-1';
  const room = supportConversationRoom(conversationId);
  const findUnique = jest.fn();
  const join = jest.fn();
  const socketsLeave = jest.fn();
  const inRoom = jest.fn().mockReturnValue({ socketsLeave });
  const gateway = new EventsGateway(
    {} as never,
    { supportConversation: { findUnique } } as never,
    {} as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    gateway.server = { in: inRoom } as never;
    findUnique.mockResolvedValue({
      assignedToId: 'staff-1',
      patient: { userId: 'patient-1' },
    });
  });

  it('only joins participants to a conversation room', async () => {
    const client = {
      data: { authReady: Promise.resolve(), userId: 'other-user' },
      join,
    };

    await gateway.handleJoinConversation(client as never, { conversationId });
    expect(join).not.toHaveBeenCalled();

    client.data.userId = 'staff-1';
    await gateway.handleJoinConversation(client as never, { conversationId });
    expect(join).toHaveBeenCalledWith(room);
  });

  it('removes all sockets of a former assignee from the conversation room', () => {
    gateway.removeUserFromConversation('staff-1', conversationId);

    expect(inRoom).toHaveBeenCalledWith('user_staff-1');
    expect(socketsLeave).toHaveBeenCalledWith(room);
  });
});
