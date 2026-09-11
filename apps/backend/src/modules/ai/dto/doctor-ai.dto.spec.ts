import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  AnalyzeXrayDto,
  GenerateAftercareDto,
  SendAftercareDto,
} from './doctor-ai.dto';

describe('AnalyzeXrayDto', () => {
  const validateInput = (input: Record<string, unknown>) =>
    validate(plainToInstance(AnalyzeXrayDto, input));

  it('accepts a database image id', async () => {
    expect(
      await validateInput({ imageId: '11111111-1111-4111-8111-111111111111' }),
    ).toHaveLength(0);
  });

  it.each([
    {},
    { imageId: 'not-a-uuid' },
    { imageUrl: 'https://example.com/xray.jpg' },
    { imageBase64: 'data:image/jpeg;base64,AAAA' },
  ])('rejects an untrusted or missing image source: %o', async (input) => {
    expect(await validateInput(input)).not.toHaveLength(0);
  });
});

describe('GenerateAftercareDto & SendAftercareDto', () => {
  it('validates GenerateAftercareDto with optional clinical fields', async () => {
    const valid = plainToInstance(GenerateAftercareDto, {
      medicalRecordId: '11111111-1111-4111-8111-111111111111',
      diagnosis: 'Viêm lợi cấp',
      followUpDate: '2026-09-20',
    });
    const errors = await validate(valid);
    expect(errors).toHaveLength(0);
  });

  it('validates SendAftercareDto requiring non-empty content', async () => {
    const invalid = plainToInstance(SendAftercareDto, {
      medicalRecordId: '11111111-1111-4111-8111-111111111111',
    });
    const errors = await validate(invalid);
    expect(errors.length).toBeGreaterThan(0);

    const valid = plainToInstance(SendAftercareDto, {
      medicalRecordId: '11111111-1111-4111-8111-111111111111',
      content: 'Uống thuốc đúng giờ và súc miệng nước muối.',
    });
    const validErrors = await validate(valid);
    expect(validErrors).toHaveLength(0);
  });
});

