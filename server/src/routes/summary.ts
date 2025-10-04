import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const [totalPatients, revenueAgg, pendingLabWorks] = await Promise.all([
      prisma.patient.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.labWork.count({ where: { delivered: false } })
    ]);
    res.json({
      totalPatients,
      totalRevenue: revenueAgg._sum.amount || 0,
      pendingLabWorks
    });
  } catch (e) { next(e); }
});

export default router;
