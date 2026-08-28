import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AnalyzeXrayDto } from './doctor-ai.dto';

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
