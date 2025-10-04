import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Resequence Patient.displayNumber to be 1..N with stable ordering by createdAt then id.
 * Should be called inside an admin action after a patient deletion.
 */
export async function resequencePatientDisplayNumbers() {
  const patients = await prisma.patient.findMany({
    orderBy: [
      { createdAt: 'asc' },
      { id: 'asc' }
    ],
    select: { id: true }
  });

  let counter = 1;
  for (const p of patients) {
    await prisma.patient.update({ where: { id: p.id }, data: { displayNumber: counter } });
    counter++;
  }
}

if (process.env.RUN_DIRECTLY === 'true') {
  resequencePatientDisplayNumbers().then(() => {
    console.log('Resequenced');
  }).catch(e => {
    console.error(e);
  }).finally(() => prisma.$disconnect());
}
