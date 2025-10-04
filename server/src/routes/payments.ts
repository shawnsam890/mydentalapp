import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

const createSchema = z.object({
  patientId: z.number().int().positive(),
  visitId: z.number().int().positive().optional(),
  amount: z.number().int().positive(),
  method: z.string().optional(),
  note: z.string().optional()
});

router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const payment = await prisma.payment.create({ data });
    res.status(201).json(payment);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prisma.payment.delete({ where: { id } });
    res.status(204).send();
  } catch (e) { next(e); }
});

// Unlink (detach) the payment from its visit without deleting the payment
router.patch('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.payment.update({ where: { id }, data: { visitId: null } });
    res.json(updated);
  } catch (e) { next(e); }
});

export default router;
