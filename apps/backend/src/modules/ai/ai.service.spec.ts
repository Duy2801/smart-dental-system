import { reviewPrescriptionSafety } from './ai.service';

describe('reviewPrescriptionSafety', () => {
  it('reports missing dosage fields without asking an LLM', () => {
    const result = reviewPrescriptionSafety(
      [{ medicineName: 'Paracetamol', dosage: '500 mg' }],
      null,
    );

    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.missingInformation).toEqual([
      {
        itemIndex: 0,
        medicineName: 'Paracetamol',
        fields: ['frequency', 'duration'],
      },
    ]);
  });

  it('detects duplicate ingredients, allergy, and interaction keywords', () => {
    const result = reviewPrescriptionSafety(
      [
        {
          medicineName: 'Amoxicillin 500 mg',
          dosage: '500 mg',
          frequency: '3 lần/ngày',
          duration: '5 ngày',
        },
        {
          medicineName: 'Augmentin 625 mg',
          dosage: '625 mg',
          frequency: '2 lần/ngày',
          duration: '5 ngày',
        },
        {
          medicineName: 'Ibuprofen 400 mg',
          dosage: '400 mg',
          frequency: '2 lần/ngày',
          duration: '3 ngày',
        },
      ],
      'Dị ứng: penicillin\nĐang dùng warfarin.',
    );

    expect(result.warnings.map((warning) => warning.title)).toEqual(
      expect.arrayContaining([
        'Trùng hoạt chất',
        'Nguy cơ dị ứng thuốc',
        'Tương tác với thuốc chống đông',
      ]),
    );
  });

  it('does not treat an explicit no-allergy line as an allergy', () => {
    const result = reviewPrescriptionSafety(
      [
        {
          medicineName: 'Amoxicillin',
          dosage: '500 mg',
          frequency: '3 lần/ngày',
          duration: '5 ngày',
        },
      ],
      'Không có dị ứng thuốc đã biết.',
    );

    expect(result.status).toBe('CLEAR');
    expect(result.warnings).toEqual([]);
  });

  it('detects an explicitly named allergy outside the alias catalog', () => {
    const result = reviewPrescriptionSafety(
      [
        {
          medicineName: 'Azithromycin',
          dosage: '500 mg',
          frequency: '1 lần/ngày',
          duration: '3 ngày',
        },
      ],
      'Dị ứng: azithromycin.',
    );

    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.warnings.map((warning) => warning.title)).toContain(
      'Nguy cơ dị ứng thuốc',
    );
  });

  it('does not return clear for a medicine outside the supported catalog', () => {
    const result = reviewPrescriptionSafety(
      [
        {
          medicineName: 'Azithromycin',
          dosage: '500 mg',
          frequency: '1 lần/ngày',
          duration: '3 ngày',
        },
      ],
      'Không có dị ứng thuốc đã biết.',
    );

    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.warnings.map((warning) => warning.title)).toContain(
      'Hoạt chất ngoài danh mục quy tắc',
    );
  });

  it('matches medicine names only inside an allergy statement', () => {
    const result = reviewPrescriptionSafety(
      [
        {
          medicineName: 'Paracetamol',
          dosage: '500 mg',
          frequency: '2 lần/ngày',
          duration: '3 ngày',
        },
      ],
      'Dị ứng: penicillin. Đang dùng paracetamol trước đó.',
    );

    expect(result.status).toBe('CLEAR');
    expect(result.warnings).toEqual([]);
  });

  it('flags an obviously excessive paracetamol dose', () => {
    const result = reviewPrescriptionSafety(
      [
        {
          medicineName: 'Paracetamol',
          dosage: '5000 mg',
          frequency: '1 lần/ngày',
          duration: '1 ngày',
        },
      ],
      'Không có dị ứng thuốc đã biết.',
    );

    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.warnings.map((warning) => warning.title)).toContain(
      'Liều paracetamol cần kiểm tra ngay',
    );
  });
});
