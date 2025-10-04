import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { createOrthodonticPlan } from '../services/visitService';

const prisma = new PrismaClient();
const router = Router();

const createPlanSchema = z.object({
  patientId: z.number().int().positive(),
  bracketType: z.enum(['METAL_REGULAR','METAL_PREMIUM']),
  totalAmount: z.number().int().positive(),
  doctorName: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.string().datetime()).optional()
});

router.post('/plan', async (req, res, next) => {
  try {
    const data = createPlanSchema.parse(req.body);
    const created = await createOrthodonticPlan(data);
    res.status(201).json(created);
  } catch (e) { next(e); }
});

const addTreatmentSchema = z.object({
  planId: z.number().int().positive(),
  treatmentLabel: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.string().datetime()).optional()
});

router.post('/treatment', async (req, res, next) => {
  try {
    const data = addTreatmentSchema.parse(req.body);
    // Ensure plan exists and get visit to verify
    const plan = await prisma.orthodonticPlan.findUnique({ where: { id: data.planId }, select: { id: true } });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    const treatment = await prisma.orthodonticTreatment.create({ data: { planId: data.planId, treatmentLabel: data.treatmentLabel, date: data.date ? new Date(data.date) : undefined } });
    res.status(201).json(treatment);
  } catch (e) { next(e); }
});

export default router;
