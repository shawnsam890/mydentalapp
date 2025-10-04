import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GeneralVisitInput {
  patientId: number;
  date?: string; // ISO
  notes?: string;
  nextAppointmentDate?: string;
  complaints?: { complaintOptionId: number; quadrantOptionId: number; }[];
  oralFindings?: { toothNumber: string; findingOptionId: number; }[];
  investigations?: { typeOptionId: number; findings?: string; toothNumber?: string; imagePath?: string; }[];
  treatmentPlan?: { treatmentOptionId: number; toothNumber?: string }[];
  treatmentDone?: { treatmentOptionId: number; toothNumber?: string; notes?: string }[];
  prescriptions?: { medicineId: number; timing?: string; quantity?: number; days?: number; notes?: string }[];
}

export async function createGeneralVisit(input: GeneralVisitInput) {
  const created = await prisma.visit.create({
    data: {
      patientId: input.patientId,
      type: 'GENERAL',
      date: input.date ? new Date(input.date) : new Date(),
      generalDetails: {
        create: {
          notes: input.notes,
          nextAppointmentDate: input.nextAppointmentDate ? new Date(input.nextAppointmentDate) : null,
          complaints: input.complaints?.length ? { create: input.complaints.map(c => ({ complaintId: c.complaintOptionId, quadrantId: c.quadrantOptionId })) } : undefined,
          oralFindings: input.oralFindings?.length ? { create: input.oralFindings.map(o => ({ toothNumber: o.toothNumber, findingId: o.findingOptionId })) } : undefined,
          treatmentPlans: input.treatmentPlan?.length ? { create: input.treatmentPlan.map(t => ({ treatmentId: t.treatmentOptionId, toothNumber: t.toothNumber })) } : undefined,
          treatmentsDone: input.treatmentDone?.length ? { create: input.treatmentDone.map(t => ({ treatmentId: t.treatmentOptionId, toothNumber: t.toothNumber, notes: t.notes })) } : undefined
        }
      },
      prescriptions: input.prescriptions?.length ? { create: input.prescriptions.map((p, idx) => ({ slNo: idx + 1, medicineId: p.medicineId, timing: p.timing, quantity: p.quantity, days: p.days, notes: p.notes })) } : undefined
    },
    include: {
      generalDetails: { include: { 
        complaints: { include: { complaint: true, quadrant: true } }, 
        oralFindings: { include: { finding: true } }, 
        investigations: { include: { typeOption: true } }, 
        treatmentPlans: { include: { treatment: true } },
        treatmentsDone: { include: { treatment: true } }
      } },
      prescriptions: { include: { medicine: true } }
    }
  });

  // Create investigations separately since they use a different schema now
  if (input.investigations?.length) {
    await prisma.investigation.createMany({
      data: input.investigations.map(i => ({
        generalVisitId: created.generalDetails!.id,
        typeOptionId: i.typeOptionId,
        findings: i.findings,
        toothNumber: i.toothNumber,
        imagePath: i.imagePath
      }))
    });
  }

  // Return the full visit with investigations included
  return prisma.visit.findUnique({
    where: { id: created.id },
    include: {
      generalDetails: { include: { 
        complaints: { include: { complaint: true, quadrant: true } }, 
        oralFindings: { include: { finding: true } }, 
        investigations: { include: { typeOption: true } }, 
        treatmentPlans: { include: { treatment: true } },
        treatmentsDone: { include: { treatment: true } }
      } },
      prescriptions: { include: { medicine: true } }
    }
  });
}

export async function listVisitsForPatient(patientId: number) {
  return prisma.visit.findMany({
    where: { patientId },
    orderBy: { date: 'desc' },
    include: {
      generalDetails: { include: { 
        complaints: { include: { complaint: true, quadrant: true } }, 
        oralFindings: { include: { finding: true } }, 
        investigations: true, 
        treatmentPlans: { include: { treatment: true } },
        treatmentsDone: { include: { treatment: true } }
      } },
      prescriptions: { include: { medicine: true } },
      orthodonticPlan: true,
      rootCanalPlan: true,
	followUpOf: { select: { id: true, date: true, type: true } },
	followUps: { include: { 
        generalDetails: { include: { oralFindings: { include: { finding: true } }, investigations: true, treatmentPlans: { include: { treatment: true } }, treatmentsDone: { include: { treatment: true } } } },
        prescriptions: { include: { medicine: true } }
      } }
    }
  });
}

export async function getVisitById(id: number) {
  return prisma.visit.findUnique({
    where: { id },
    include: {
      generalDetails: { include: { 
        complaints: { include: { complaint: true, quadrant: true } }, 
        oralFindings: { include: { finding: true } }, 
        investigations: true, 
        treatmentPlans: { include: { treatment: true } },
        treatmentsDone: { include: { treatment: true } }
      } },
      prescriptions: { include: { medicine: true } },
      orthodonticPlan: true,
      rootCanalPlan: true,
	followUpOf: { select: { id: true, date: true, type: true } },
	followUps: { include: { 
        generalDetails: { include: { oralFindings: { include: { finding: true } }, investigations: true, treatmentPlans: { include: { treatment: true } }, treatmentsDone: { include: { treatment: true } } } },
        prescriptions: { include: { medicine: true } }
      } }
    }
  });
}

export async function createFollowUpVisit(input: { patientId: number; baseVisitId: number; notes?: string; date?: string; nextAppointmentDate?: string; oralFindings?: { toothNumber: string; findingOptionId: number; }[]; investigations?: { typeOptionId: number; findings?: string; toothNumber?: string; imagePath?: string; }[]; treatmentPlan?: { treatmentOptionId: number; toothNumber?: string }[]; treatmentDone?: { treatmentOptionId: number; toothNumber?: string; notes?: string }[]; prescriptions?: { medicineId: number; timing?: string; quantity?: number; days?: number; notes?: string }[]; }) {
  // Validate base visit belongs to patient
  const base = await prisma.visit.findUnique({ where: { id: input.baseVisitId }, select: { id: true, patientId: true } });
  if (!base || base.patientId !== input.patientId) {
    throw new Error('Base visit not found for patient');
  }
  const created = await prisma.visit.create({
    data: {
      patientId: input.patientId,
      type: 'FOLLOW_UP',
      followUpOfId: input.baseVisitId,
      date: input.date ? new Date(input.date) : new Date(),
      generalDetails: {
        create: {
          notes: input.notes,
          nextAppointmentDate: input.nextAppointmentDate ? new Date(input.nextAppointmentDate) : null,
          oralFindings: input.oralFindings?.length ? { create: input.oralFindings.map(o => ({ toothNumber: o.toothNumber, findingId: o.findingOptionId })) } : undefined,
          treatmentPlans: input.treatmentPlan?.length ? { create: input.treatmentPlan.map(t => ({ treatmentId: t.treatmentOptionId, toothNumber: t.toothNumber })) } : undefined,
          treatmentsDone: input.treatmentDone?.length ? { create: input.treatmentDone.map(t => ({ treatmentId: t.treatmentOptionId, toothNumber: t.toothNumber, notes: t.notes })) } : undefined
        }
      },
      prescriptions: input.prescriptions?.length ? { create: input.prescriptions.map((p, idx) => ({ slNo: idx + 1, medicineId: p.medicineId, timing: p.timing, quantity: p.quantity, days: p.days, notes: p.notes })) } : undefined
    },
    include: {
      followUpOf: { select: { id: true, date: true, type: true } },
      generalDetails: { include: { oralFindings: { include: { finding: true } }, investigations: { include: { typeOption: true } }, treatmentPlans: { include: { treatment: true } }, treatmentsDone: { include: { treatment: true } } } },
      prescriptions: { include: { medicine: true } }
    }
  });

  // Create investigations separately since they use a different schema now
  if (input.investigations?.length) {
    await prisma.investigation.createMany({
      data: input.investigations.map(i => ({
        generalVisitId: created.generalDetails!.id,
        typeOptionId: i.typeOptionId,
        findings: i.findings,
        toothNumber: i.toothNumber,
        imagePath: i.imagePath
      }))
    });
  }

  // Return the full visit with investigations included
  return prisma.visit.findUnique({
    where: { id: created.id },
    include: {
      followUpOf: { select: { id: true, date: true, type: true } },
      generalDetails: { include: { oralFindings: { include: { finding: true } }, investigations: { include: { typeOption: true } }, treatmentPlans: { include: { treatment: true } }, treatmentsDone: { include: { treatment: true } } } },
      prescriptions: { include: { medicine: true } }
    }
  });
}

export async function createOrthodonticPlan(input: { patientId: number; bracketType: 'METAL_REGULAR' | 'METAL_PREMIUM'; totalAmount: number; doctorName?: string; date?: string }) {
  return prisma.visit.create({
    data: {
      patientId: input.patientId,
      type: 'ORTHODONTIC',
      date: input.date ? new Date(input.date) : undefined,
      orthodonticPlan: { create: { bracketType: input.bracketType, totalAmount: input.totalAmount, doctorName: input.doctorName } }
    },
    include: { orthodonticPlan: { include: { treatments: true } } }
  });
}

export async function createRootCanalPlan(input: { patientId: number; totalAmount: number; date?: string }) {
  return prisma.visit.create({
    data: {
      patientId: input.patientId,
      type: 'ROOT_CANAL',
      date: input.date ? new Date(input.date) : undefined,
      rootCanalPlan: { create: { totalAmount: input.totalAmount } }
    },
    include: { rootCanalPlan: { include: { procedures: true } } }
  });
}

export async function addRootCanalProcedure(input: { planId: number; procedureLabel: string; date?: string }) {
  return prisma.rootCanalProcedure.create({
    data: {
      planId: input.planId,
      procedureLabel: input.procedureLabel,
      date: input.date ? new Date(input.date) : undefined
    }
  });
}
