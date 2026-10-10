import { SupportConversationService } from './support-conversation.service';

describe('SupportConversationService requeue', () => {
  it('removes the former assignee from the socket room after requeueing', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const removeUserFromConversation = jest.fn();
    const emitToUser = jest.fn();
    const emitToRoom = jest.fn();
    const service = new SupportConversationService(
      {
        supportMessage: { findFirst },
        supportConversation: { updateMany },
      } as never,
      { removeUserFromConversation, emitToUser, emitToRoom } as never,
      {} as never,
    );

    await service['requeueIfUnanswered']('conversation-1', 'staff-1');

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'conversation-1',
          assignedToId: 'staff-1',
        }),
      }),
    );
    expect(removeUserFromConversation).toHaveBeenCalledWith(
      'staff-1',
      'conversation-1',
    );
    expect(emitToRoom).toHaveBeenCalled();
  });
});
