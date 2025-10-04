import { PrismaClient, Prisma } from '@prisma/client';
import { resequencePatientDisplayNumbers } from '../utils/resequenceDisplayNumbers';

const prisma = new PrismaClient();

export interface CreatePatientInput {
  name: string;
  age?: number;
  sex: 'M' | 'F' | 'Other';
  address?: string;
  phone?: string;
  whatsapp?: boolean;
  displayNumberOverride?: number; // allows manual edit
}

export async function createPatient(data: CreatePatientInput) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let displayNumber: number;
    if (data.displayNumberOverride) {
      displayNumber = data.displayNumberOverride;
      // Shift others >= that number up by 1
      await tx.patient.updateMany({
        where: { displayNumber: { gte: displayNumber } },
        data: { displayNumber: { increment: 1 } } as any // increment only works on Int fields
      });
    } else {
      const max = await tx.patient.aggregate({ _max: { displayNumber: true } });
      displayNumber = (max._max.displayNumber || 0) + 1;
    }
    const created = await tx.patient.create({
      data: {
        name: data.name,
        age: data.age,
        sex: data.sex,
        address: data.address,
        phone: data.phone,
        whatsapp: data.whatsapp ?? false,
        displayNumber
      }
    });
    return created;
  });
}

export async function listPatients() {
  return prisma.patient.findMany({ orderBy: { displayNumber: 'asc' } });
}

export async function deletePatient(id: number) {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.patient.delete({ where: { id } });
  });
  // Resequence after commit
  await resequencePatientDisplayNumbers();
}

export async function updatePatientDisplayNumber(id: number, newDisplay: number) {
  // Reassign display numbers safely
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const target = await tx.patient.findUnique({ where: { id } });
    if (!target) throw new Error('Patient not found');
    const oldDisplay = target.displayNumber;
    if (oldDisplay === newDisplay) return target;
    if (newDisplay < oldDisplay) {
      // Shift up those in [newDisplay, oldDisplay-1]
      await tx.patient.updateMany({
        where: { displayNumber: { gte: newDisplay, lt: oldDisplay } },
        data: { displayNumber: { increment: 1 } } as any
      });
    } else {
      // Shift down those in (oldDisplay, newDisplay]
      await tx.patient.updateMany({
        where: { displayNumber: { gt: oldDisplay, lte: newDisplay } },
        data: { displayNumber: { decrement: 1 } } as any
      });
    }
    return tx.patient.update({ where: { id }, data: { displayNumber: newDisplay } });
  });
}

export async function getPatientById(id: number) {
  return prisma.patient.findUnique({ where: { id } });
}
