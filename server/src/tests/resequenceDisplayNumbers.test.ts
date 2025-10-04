import { resequencePatientDisplayNumbers } from '../utils/resequenceDisplayNumbers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('resequencePatientDisplayNumbers', () => {
  beforeAll(async () => {
    await prisma.patient.deleteMany();
    // Create patients with non-sequential display numbers intentionally
    for (let i = 0; i < 3; i++) {
      const p = await prisma.patient.create({ data: { name: `P${i+1}`, age: 30, sex: 'M', displayNumber: i+10 } });
      expect(p.displayNumber).toBe(i + 10);
    }
  });

  it('resequences display numbers to 1..N', async () => {
    await resequencePatientDisplayNumbers();
    const patients = await prisma.patient.findMany({ orderBy: { displayNumber: 'asc' } });
    expect(patients.map(p => p.displayNumber)).toEqual([1,2,3]);
  });
});
