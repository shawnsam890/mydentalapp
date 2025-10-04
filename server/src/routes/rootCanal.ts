import { Router } from 'express';
import { z } from 'zod';
import { createRootCanalPlan, addRootCanalProcedure } from '../services/visitService';

const router = Router();

const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // allow YYYY-MM-DD in addition to ISO

const createPlanSchema = z.object({
  patientId: z.number(),
  totalAmount: z.number().positive(),
  date: z.string().optional().refine(v => !v || dateRegex.test(v) || !isNaN(Date.parse(v)), 'Invalid date format')
});

router.post('/plan', async (req, res) => {
  try {
    const parsed = createPlanSchema.parse(req.body);
    const visit = await createRootCanalPlan(parsed);
    res.json(visit);
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});

const addProcedureSchema = z.object({
  planId: z.number(),
  procedureLabel: z.string().min(1),
  date: z.string().optional().refine(v => !v || dateRegex.test(v) || !isNaN(Date.parse(v)), 'Invalid date format')
});

router.post('/procedure', async (req, res) => {
  try {
    const parsed = addProcedureSchema.parse(req.body);
    const proc = await addRootCanalProcedure(parsed);
    res.json(proc);
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});

export default router;
