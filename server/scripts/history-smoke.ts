import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run(){
  // Ensure at least one patient exists
  const patient = await prisma.patient.findFirst();
  if(!patient){
    console.log('No patient found. Create a patient first.');
    return;
  }
  // Create sample options if missing
  const dh = await prisma.dentalHistoryOption.upsert({ where: { label: 'Extraction' }, update: {}, create: { label: 'Extraction' } });
  const mh = await prisma.medicalHistoryOption.upsert({ where: { label: 'Diabetes' }, update: {}, create: { label: 'Diabetes' } });
  const al = await prisma.allergyOption.upsert({ where: { label: 'Penicillin' }, update: {}, create: { label: 'Penicillin' } });
  // Replace patient sets
  await prisma.patientDentalHistory.deleteMany({ where: { patientId: patient.id } });
  await prisma.patientMedicalHistory.deleteMany({ where: { patientId: patient.id } });
  await prisma.patientAllergy.deleteMany({ where: { patientId: patient.id } });
  await prisma.patientDentalHistory.create({ data: { patientId: patient.id, optionId: dh.id } });
  await prisma.patientMedicalHistory.create({ data: { patientId: patient.id, optionId: mh.id } });
  await prisma.patientAllergy.create({ data: { patientId: patient.id, optionId: al.id } });
  const full = await prisma.patient.findUnique({ where: { id: patient.id }, include: { dentalHistoryItems: { include: { option: true } }, medicalHistoryItems: { include: { option: true } }, allergyItems: { include: { option: true } } } });
  console.log({
    patient: patient.id,
    dental: full?.dentalHistoryItems.map(i=> i.option.label),
    medical: full?.medicalHistoryItems.map(i=> i.option.label),
    allergies: full?.allergyItems.map(i=> i.option.label)
  });
}

run().finally(()=> prisma.$disconnect());
