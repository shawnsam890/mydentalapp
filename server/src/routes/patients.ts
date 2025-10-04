import { Router } from 'express';
import { z } from 'zod';
import { createPatient, listPatients, deletePatient, updatePatientDisplayNumber, getPatientById } from '../services';
import { PrismaClient } from '@prisma/client';
import { listVisitsForPatient } from '../services/visitService';

const prisma = new PrismaClient();

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive().optional(),
  sex: z.enum(['M','F','Other']),
  address: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.boolean().optional(),
  displayNumberOverride: z.number().int().positive().optional()
});

router.get('/', async (_req, res, next) => {
  try {
    const patients = await listPatients();
    res.json(patients);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const patient = await createPatient(data);
    res.status(201).json(patient);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const patient = await getPatientById(id);
    if (!patient) return res.status(404).json({ error: 'Not found' });
    res.json(patient);
  } catch (e) { next(e); }
});

// Full detail: patient + visits + payments summary
router.get('/:id/full', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const patient = await getPatientById(id);
    if (!patient) return res.status(404).json({ error: 'Not found' });
    const [visits, payments, totalPaid, dentalHistory, medicalHistory, allergies] = await Promise.all([
      listVisitsForPatient(id),
      prisma.payment.findMany({
        where: { patientId: id },
        orderBy: { date: 'desc' },
        include: { visit: { select: { id: true, date: true, type: true } } }
      }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { patientId: id } }),
      prisma.patientDentalHistory.findMany({ where: { patientId: id }, include: { option: true } }),
      prisma.patientMedicalHistory.findMany({ where: { patientId: id }, include: { option: true } }),
      prisma.patientAllergy.findMany({ where: { patientId: id }, include: { option: true } })
    ]);
    res.json({ patient, visits, payments, totalPaid: totalPaid._sum.amount || 0, dentalHistory, medicalHistory, allergies });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await deletePatient(id);
    res.status(204).send();
  } catch (e) { next(e); }
});

router.patch('/:id/display', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const body = z.object({ newDisplay: z.number().int().positive() }).parse(req.body);
    const updated = await updatePatientDisplayNumber(id, body.newDisplay);
    res.json(updated);
  } catch (e) { next(e); }
});

// Patch patient history selections (replace sets)
router.patch('/:id/history', async (req,res,next)=> {
  try {
    const id = Number(req.params.id);
    const body = z.object({
      dentalHistoryIds: z.array(z.number().int().positive()).optional(),
      medicalHistoryIds: z.array(z.number().int().positive()).optional(),
      allergyIds: z.array(z.number().int().positive()).optional()
    }).parse(req.body);
    // Ensure patient exists
    await prisma.patient.findFirstOrThrow({ where: { id } });
    // Replace sets inside a transaction
    const result = await prisma.$transaction(async(tx)=> {
      if(body.dentalHistoryIds){
        await tx.patientDentalHistory.deleteMany({ where: { patientId: id } });
        if(body.dentalHistoryIds.length){
          await tx.patientDentalHistory.createMany({ data: body.dentalHistoryIds.map(optionId=> ({ patientId: id, optionId })) });
        }
      }
      if(body.medicalHistoryIds){
        await tx.patientMedicalHistory.deleteMany({ where: { patientId: id } });
        if(body.medicalHistoryIds.length){
          await tx.patientMedicalHistory.createMany({ data: body.medicalHistoryIds.map(optionId=> ({ patientId: id, optionId })) });
        }
      }
      if(body.allergyIds){
        await tx.patientAllergy.deleteMany({ where: { patientId: id } });
        if(body.allergyIds.length){
          await tx.patientAllergy.createMany({ data: body.allergyIds.map(optionId=> ({ patientId: id, optionId })) });
        }
      }
      return { ok: true };
    });
    res.json(result);
  } catch(e){ next(e); }
});

export default router;
