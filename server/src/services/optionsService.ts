import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listComplaintOptions() {
  return prisma.complaintOption.findMany({ orderBy: { label: 'asc' } });
}
export async function listQuadrantOptions() {
  return prisma.quadrantOption.findMany({ orderBy: { code: 'asc' } });
}
export async function listOralFindingOptions() {
  return prisma.oralFindingOption.findMany({ orderBy: { label: 'asc' } });
}
export async function listTreatmentOptions() {
  return prisma.treatmentOption.findMany({ orderBy: { label: 'asc' } });
}
export async function listMedicines() {
  return prisma.medicine.findMany({ orderBy: { name: 'asc' } });
}

export async function listInvestigationTypeOptions() {
  return prisma.investigationTypeOption.findMany({ where: { active: true }, orderBy: { label: 'asc' } });
}

// Create functions for all option types
export async function createComplaintOption(label: string) {
  return prisma.complaintOption.create({ data: { label } });
}

export async function createOralFindingOption(label: string) {
  return prisma.oralFindingOption.create({ data: { label } });
}

export async function createTreatmentOption(label: string, category?: string) {
  return prisma.treatmentOption.create({ data: { label, category } });
}

export async function createMedicine(name: string) {
  return prisma.medicine.create({ data: { name } });
}

export async function createInvestigationTypeOption(label: string) {
  return prisma.investigationTypeOption.create({ data: { label } });
}

// New history/allergy option helpers
export async function listDentalHistoryOptions() {
  return prisma.dentalHistoryOption.findMany({ where: { active: true }, orderBy: { label: 'asc' } });
}
export async function listMedicalHistoryOptions() {
  return prisma.medicalHistoryOption.findMany({ where: { active: true }, orderBy: { label: 'asc' } });
}
export async function listAllergyOptions() {
  return prisma.allergyOption.findMany({ where: { active: true }, orderBy: { label: 'asc' } });
}

export async function createDentalHistoryOption(label: string){
  return prisma.dentalHistoryOption.create({ data: { label } });
}
export async function createMedicalHistoryOption(label: string){
  return prisma.medicalHistoryOption.create({ data: { label } });
}
export async function createAllergyOption(label: string){
  return prisma.allergyOption.create({ data: { label } });
}
