import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Ensure at least some initial selectable options
  const complaintOptions = ['Pain','Stains','Swelling','Sensitivity','Mobile tooth','Decayed Tooth','Broken Tooth'];
  for (const label of complaintOptions) {
    await prisma.complaintOption.upsert({ where: { label }, update: {}, create: { label } });
  }

  const quadrants = ['U/L','U/R','U/F','L/R','L/L','L/F','All'];
  for (const code of quadrants) {
    await prisma.quadrantOption.upsert({ where: { code }, update: {}, create: { code } });
  }

  const oralFindings = ['DDC','DC','PI','Generalized Stains and Deposits','ECC','Initial Carious Lesion','Severe Black stains','Grade 1 mobile'];
  for (const label of oralFindings) {
    await prisma.oralFindingOption.upsert({ where: { label }, update: {}, create: { label } });
  }

  const treatments = ['Root Canal','Oral Prophylaxis','Extraction','Filling','Alignment Review'];
  for (const label of treatments) {
    await prisma.treatmentOption.upsert({ where: { label }, update: {}, create: { label } });
  }

  const meds = ['Amoxicillin 500mg','Ibuprofen 400mg','Paracetamol 500mg','Chlorhexidine Mouthwash'];
  for (const name of meds) {
    await prisma.medicine.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log('Seed complete');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
