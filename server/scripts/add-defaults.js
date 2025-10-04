const { PrismaClient } = require('@prisma/client');

async function addDefaults() {
  const prisma = new PrismaClient();
  try {
    await prisma.investigationTypeOption.createMany({
      data: [
        { label: 'IOPAR' },
        { label: 'OPG' },
        { label: 'CBCT' }
      ]
    });
    console.log('Default investigation types added');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

addDefaults();