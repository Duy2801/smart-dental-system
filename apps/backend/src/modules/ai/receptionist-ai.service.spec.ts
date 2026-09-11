import { AiService } from './ai.service';

describe('AiService receptionist chat', () => {
  it('rate limits by receptionist and forwards only bounded history with attribution', async () => {
    const aiClient = { post: jest.fn().mockResolvedValue({ reply: ' Hướng dẫn ' }) };
    const rateLimit = { consume: jest.fn() };
    const service = new AiService({} as never, aiClient as never, rateLimit as never, {} as never);
    const history = Array.from({ length: 12 }, (_, index) => ({ role: 'user' as const, content: `m${index}` }));

    await expect(service.receptionistChat({ userId: 'staff-1' } as never, { message: ' hỏi ', history })).resolves.toEqual({ reply: 'Hướng dẫn' });
    expect(rateLimit.consume).toHaveBeenCalledWith('receptionist:staff-1');
    expect(aiClient.post).toHaveBeenCalledWith('/api/v1/chatbot/receptionist-chat', {
      created_by_user_id: 'staff-1', message: 'hỏi', history: history.slice(-10), locale: 'vi',
    });
  });
});
