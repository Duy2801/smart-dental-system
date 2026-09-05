import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateMedicalRecordDto } from './update-medical-record.dto';

describe('UpdateMedicalRecordDto', () => {
  it('rejects invalid and duplicate FDI tooth numbers', async () => {
    const dto = plainToInstance(UpdateMedicalRecordDto, {
      dentalChart: {
        teeth: [
          { number: 19, status: 'caries' },
          { number: 11, status: 'healthy' },
          { number: 11, status: 'filled' },
        ],
      },
    });

    const errors = await validate(dto);

    expect(errors).not.toHaveLength(0);
  });

  it('accepts a unique set of valid FDI tooth numbers', async () => {
    const dto = plainToInstance(UpdateMedicalRecordDto, {
      dentalChart: {
        teeth: [
          { number: 18, status: 'caries' },
          { number: 21, status: 'healthy' },
          { number: 48, status: 'implant' },
        ],
      },
    });

    expect(await validate(dto)).toHaveLength(0);
  });
});
