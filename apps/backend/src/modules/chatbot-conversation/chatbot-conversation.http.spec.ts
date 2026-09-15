import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { ChatbotConversationController } from './chatbot-conversation.controller';
import { ChatbotConversationService } from './chatbot-conversation.service';
import { ChatbotServiceKeyGuard } from './chatbot-service-key.guard';

describe('chatbot HTTP authorization and validation', () => {
  let app: INestApplication;
  let service: any;
  let configValues: Record<string, string>;
  const token = new JwtService({ secret: 'test-jwt-secret' }).sign({
    sub: 'account-a',
    email: 'a@example.com',
    tokenType: 'access',
  });
  beforeAll(async () => {
    configValues = {
      NODE_ENV: 'production',
      AI_SERVICE_API_KEY: 'test-service-key',
      JWT_SECRET: 'test-jwt-secret',
    };
    service = Object.fromEntries(
      [
        'getInternalServices',
        'getInternalDoctors',
        'getInternalPatients',
        'createInternalPatient',
        'getInternalSlots',
        'getInternalAppointments',
        'bookInternalAppointment',
        'getInternalClinic',
      ].map((name) => [name, jest.fn().mockResolvedValue([])]),
    );
    service.getHistory = jest
      .fn()
      .mockImplementation((user) =>
        Promise.resolve({
          messages: [{ id: '1', sender: 'bot', text: user.userId }],
        }),
      );
    service.putHistory = jest
      .fn()
      .mockImplementation((_user, body) => Promise.resolve(body));
    service.deleteHistory = jest.fn().mockResolvedValue({ messages: [] });
    const module = await Test.createTestingModule({
      controllers: [ChatbotConversationController],
      providers: [
        ChatbotServiceKeyGuard,
        JwtStrategy,
        { provide: ChatbotConversationService, useValue: service },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => configValues[key],
            getOrThrow: (key: string) => configValues[key],
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: async ({ where }) => ({
                id: where.id,
                email: 'a@example.com',
                status: 'ACTIVE',
                role: { code: 'PATIENT', permissions: [] },
              }),
            },
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
  });

  const internal = [
    ['get', 'services'],
    ['get', 'doctors'],
    ['get', 'patients'],
    ['post', 'patients'],
    ['get', 'slots'],
    ['get', 'appointments'],
    ['post', 'book'],
    ['get', 'clinic'],
  ];
  it.each(internal)(
    '%s internal/%s rejects a missing service key',
    async (verb, path) => {
      await request(app.getHttpServer())
        [verb](`/chatbot-conversations/internal/${path}`)
        .expect(401);
    },
  );
  it.each(internal)(
    '%s internal/%s rejects an invalid service key',
    async (verb, path) => {
      await request(app.getHttpServer())
        [verb](`/chatbot-conversations/internal/${path}`)
        .set('x-api-key', 'wrong')
        .expect(401);
    },
  );
  it('accepts the configured service key', async () => {
    await request(app.getHttpServer())
      .get('/chatbot-conversations/internal/services')
      .set('x-api-key', 'test-service-key')
      .expect(200);
  });
  it('fails closed when the production service key is absent', async () => {
    delete configValues.AI_SERVICE_API_KEY;
    await request(app.getHttpServer())
      .get('/chatbot-conversations/internal/services')
      .set('x-api-key', 'dev-local-key')
      .expect(401);
    configValues.AI_SERVICE_API_KEY = 'test-service-key';
  });
  it.each(['get', 'put', 'delete'])('%s history requires JWT', async (verb) => {
    await request(app.getHttpServer())
      [verb]('/chatbot-conversations/history')
      .send({ messages: [] })
      .expect(401);
  });
  it('history derives identity from signed JWT', async () => {
    const response = await request(app.getHttpServer())
      .get('/chatbot-conversations/history')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(response.body).toEqual({
      messages: [{ id: '1', sender: 'bot', text: 'account-a' }],
    });
  });
  it.each([
    { messages: [{ id: '1', sender: 'system', text: 'bad' }] },
    {
      messages: [
        {
          id: '1',
          sender: 'bot',
          text: 'hi',
          suggestions: [{ type: 'quick_reply', label: 'hi', value: 123 }],
        },
      ],
    },
    {
      messages: [
        {
          id: '1',
          sender: 'bot',
          text: 'hi',
          sources: [{ kind: 'clinic', label: 'Clinic', secret: 'private' }],
        },
      ],
    },
    {
      messages: Array.from({ length: 61 }, () => ({
        id: '1',
        sender: 'user',
        text: 'hi',
      })),
    },
    { messages: [], patientId: 'foreign', sessionId: 'foreign-session' },
  ])(
    'history rejects malformed or caller-owned storage fields',
    async (body) => {
      await request(app.getHttpServer())
        .put('/chatbot-conversations/history')
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(400);
    },
  );
  it('history accepts bounded messages with sources and suggestions', async () => {
    const body = {
      messages: [
        {
          id: '1',
          sender: 'bot',
          text: 'Choose a service',
          suggestions: [
            {
              type: 'quick_reply',
              label: 'View prices',
              value: 'Prices',
              metadata: {},
            },
          ],
          sources: [{ kind: 'services', label: 'Clinic catalog' }],
        },
      ],
    };
    const response = await request(app.getHttpServer())
      .put('/chatbot-conversations/history')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(200);
    expect(response.body).toEqual(body);
  });
});
