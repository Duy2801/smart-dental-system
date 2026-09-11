import { validate } from 'class-validator';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import { PaymentController } from './payment.controller';

describe('SePay webhook compatibility', () => {
  const payload = {
    gateway: 'VietinBank',
    transactionDate: '2026-09-11 21:59:57',
    accountNumber: '109876820087',
    subAccount: null,
    code: null,
    content: 'SEVQRINVSEED003',
    transferType: 'in',
    description: 'BankAPINotify SEVQRINVSEED003',
    transferAmount: 10000,
    referenceCode: 'reference-1',
    accumulated: 72422,
    id: 81011682,
  };

  it('accepts all fields sent by SePay', async () => {
    const dto = Object.assign(new SepayWebhookDto(), payload);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toEqual([]);
  });

  it('accepts the Authorization: Apikey scheme used by SePay', async () => {
    const paymentService = { handleSepayWebhook: jest.fn().mockResolvedValue({ ok: true }) };
    const config = { get: jest.fn().mockReturnValue('webhook-secret') };
    const controller = new PaymentController(paymentService as never, config as never);

    await expect(
      controller.sepayWebhook(payload, 'Apikey webhook-secret'),
    ).resolves.toEqual({ ok: true });
    expect(paymentService.handleSepayWebhook).toHaveBeenCalledWith(payload);
  });
});
