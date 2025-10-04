import { Router } from 'express';
import { z } from 'zod';
import { createGeneralVisit, listVisitsForPatient, getVisitById, createFollowUpVisit } from '../services/visitService';
import { attachmentsUpload } from '../middleware/upload';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const router = Router();

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const generalVisitSchema = z.object({
  patientId: z.number().int().positive(),
  // Allow either full ISO datetime or simple date (HTML date input)
  date: z.string().refine(v => !v || dateRegex.test(v) || !isNaN(Date.parse(v)), 'Invalid date').optional(),
  notes: z.string().optional(),
  nextAppointmentDate: z.string().refine(v => !v || dateRegex.test(v) || !isNaN(Date.parse(v)), 'Invalid next appointment date').optional(),
  complaints: z.array(z.object({ complaintOptionId: z.number().int().positive(), quadrantOptionId: z.number().int().positive() })).optional(),
  oralFindings: z.array(z.object({ toothNumber: z.string().min(1), findingOptionId: z.number().int().positive() })).optional(),
  investigations: z.array(z.object({ typeOptionId: z.number().int().positive(), findings: z.string().optional(), toothNumber: z.string().optional(), imagePath: z.string().optional() })).optional(),
  treatmentPlan: z.array(z.object({ treatmentOptionId: z.number().int().positive(), toothNumber: z.string().optional() })).optional(),
  treatmentDone: z.array(z.object({ treatmentOptionId: z.number().int().positive(), toothNumber: z.string().optional(), notes: z.string().optional() })).optional(),
  prescriptions: z.array(z.object({ medicineId: z.number().int().positive(), timing: z.string().optional(), quantity: z.number().int().positive().optional(), days: z.number().int().positive().optional(), notes: z.string().optional() })).optional()
});

router.post('/general', async (req, res, next) => {
  try {
    const data = generalVisitSchema.parse(req.body);
    const created = await createGeneralVisit(data);
    res.status(201).json(created);
  } catch (e) { next(e); }
});

// Follow-up visit can capture most of the GENERAL visit details except chief complaints.
const followUpSchema = z.object({
  patientId: z.number().int().positive(),
  baseVisitId: z.number().int().positive(),
  // Accept either full ISO or simple YYYY-MM-DD (HTML date input)
  date: z.string().refine(v => !v || dateRegex.test(v) || !isNaN(Date.parse(v)), 'Invalid date').optional(),
  notes: z.string().optional(),
  nextAppointmentDate: z.string().refine(v => !v || dateRegex.test(v) || !isNaN(Date.parse(v)), 'Invalid next appointment date').optional(),
  oralFindings: z.array(z.object({ toothNumber: z.string().min(1), findingOptionId: z.number().int().positive() })).optional(),
  investigations: z.array(z.object({ typeOptionId: z.number().int().positive(), findings: z.string().optional(), toothNumber: z.string().optional(), imagePath: z.string().optional() })).optional(),
  treatmentPlan: z.array(z.object({ treatmentOptionId: z.number().int().positive(), toothNumber: z.string().optional() })).optional(),
  treatmentDone: z.array(z.object({ treatmentOptionId: z.number().int().positive(), toothNumber: z.string().optional(), notes: z.string().optional() })).optional(),
  prescriptions: z.array(z.object({ medicineId: z.number().int().positive(), timing: z.string().optional(), quantity: z.number().int().positive().optional(), days: z.number().int().positive().optional(), notes: z.string().optional() })).optional()
});

router.post('/follow-up', async (req, res, next) => {
  try {
    const data = followUpSchema.parse(req.body);
    const created = await createFollowUpVisit(data);
    res.status(201).json(created);
  } catch (e) { next(e); }
});

// FULL REPLACEMENT UPDATE (GENERAL)
const fullGeneralUpdateSchema = z.object({
  date: z.string().optional(),
  notes: z.string().optional(),
  nextAppointmentDate: z.string().optional(),
  complaints: z.array(z.object({ complaintOptionId: z.number().int().positive(), quadrantOptionId: z.number().int().positive() })).optional(),
  oralFindings: z.array(z.object({ toothNumber: z.string().min(1), findingOptionId: z.number().int().positive() })).optional(),
  investigations: z.array(z.object({ typeOptionId: z.number().int().positive(), findings: z.string().optional(), toothNumber: z.string().optional(), imagePath: z.string().optional() })).optional(),
  treatmentPlan: z.array(z.object({ treatmentOptionId: z.number().int().positive(), toothNumber: z.string().optional() })).optional(),
  treatmentDone: z.array(z.object({ treatmentOptionId: z.number().int().positive(), toothNumber: z.string().optional(), notes: z.string().optional() })).optional(),
  prescriptions: z.array(z.object({ medicineId: z.number().int().positive(), timing: z.string().optional(), quantity: z.number().int().positive().optional(), days: z.number().int().positive().optional(), notes: z.string().optional() })).optional()
});

router.put('/general/:id', async (req,res,next)=> {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id'});
  try {
    const payload = fullGeneralUpdateSchema.parse(req.body);
    const visit = await prisma.visit.findUnique({ where: { id }, include: { generalDetails: true } });
    if(!visit || visit.type !== 'GENERAL' || !visit.generalDetails) return res.status(404).json({ error: 'Not found'});
    const gdId = visit.generalDetails.id;
    await prisma.$transaction(async (tx)=> {
      // Date
      if(payload.date){ await tx.visit.update({ where: { id }, data: { date: new Date(payload.date) } }); }
      // General details simple fields
      await tx.generalVisitDetails.update({ where: { id: gdId }, data: { notes: payload.notes ?? null, nextAppointmentDate: payload.nextAppointmentDate ? new Date(payload.nextAppointmentDate) : null } });
      // Replace nested if provided
      if(payload.complaints){
        await tx.complaintOnVisit.deleteMany({ where: { generalVisitId: gdId } });
        if(payload.complaints.length){
          await tx.complaintOnVisit.createMany({ data: payload.complaints.map(c=> ({ generalVisitId: gdId, complaintId: c.complaintOptionId, quadrantId: c.quadrantOptionId })) });
        }
      }
      if(payload.oralFindings){
        await tx.oralFindingOnVisit.deleteMany({ where: { generalVisitId: gdId } });
        if(payload.oralFindings.length){
          await tx.oralFindingOnVisit.createMany({ data: payload.oralFindings.map(o=> ({ generalVisitId: gdId, toothNumber: o.toothNumber, findingId: o.findingOptionId })) });
        }
      }
      if(payload.investigations){
        await tx.investigation.deleteMany({ where: { generalVisitId: gdId } });
        if(payload.investigations.length){
          // Temporary cast to any to satisfy stale generated types expecting 'type'
          await (tx.investigation as any).createMany({ data: payload.investigations.map(i=> ({ generalVisitId: gdId, typeOptionId: i.typeOptionId, findings: i.findings, toothNumber: i.toothNumber, imagePath: i.imagePath })) });
        }
      }
      if(payload.treatmentPlan){
        await tx.treatmentPlanItem.deleteMany({ where: { generalVisitId: gdId } });
        if(payload.treatmentPlan.length){
          await tx.treatmentPlanItem.createMany({ data: payload.treatmentPlan.map(t=> ({ generalVisitId: gdId, treatmentId: t.treatmentOptionId, toothNumber: t.toothNumber })) });
        }
      }
      if(payload.treatmentDone){
        await tx.treatmentDoneItem.deleteMany({ where: { generalVisitId: gdId } });
        if(payload.treatmentDone.length){
          await tx.treatmentDoneItem.createMany({ data: payload.treatmentDone.map(t=> ({ generalVisitId: gdId, treatmentId: t.treatmentOptionId, toothNumber: t.toothNumber, notes: t.notes })) });
        }
      }
      if(payload.prescriptions){
        await tx.prescription.deleteMany({ where: { visitId: id } });
        if(payload.prescriptions.length){
          await tx.prescription.createMany({ data: payload.prescriptions.map((p,idx)=> ({ visitId: id, slNo: idx+1, medicineId: p.medicineId, timing: p.timing, quantity: p.quantity, days: p.days, notes: p.notes })) });
        }
      }
    });
    const updated = await getVisitById(id);
    res.json(updated);
  } catch(e){ next(e); }
});

// FULL REPLACEMENT UPDATE (FOLLOW-UP)
const fullFollowUpUpdateSchema = z.object({
  date: z.string().optional(),
  notes: z.string().optional(),
  nextAppointmentDate: z.string().optional(),
  oralFindings: z.array(z.object({ toothNumber: z.string().min(1), findingOptionId: z.number().int().positive() })).optional(),
  investigations: z.array(z.object({ typeOptionId: z.number().int().positive(), findings: z.string().optional(), toothNumber: z.string().optional(), imagePath: z.string().optional() })).optional(),
  treatmentPlan: z.array(z.object({ treatmentOptionId: z.number().int().positive(), toothNumber: z.string().optional() })).optional(),
  treatmentDone: z.array(z.object({ treatmentOptionId: z.number().int().positive(), toothNumber: z.string().optional(), notes: z.string().optional() })).optional(),
  prescriptions: z.array(z.object({ medicineId: z.number().int().positive(), timing: z.string().optional(), quantity: z.number().int().positive().optional(), days: z.number().int().positive().optional(), notes: z.string().optional() })).optional()
});

router.put('/follow-up/:id', async (req,res,next)=> {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id'});
  try {
    const payload = fullFollowUpUpdateSchema.parse(req.body);
    const visit = await prisma.visit.findUnique({ where: { id }, include: { generalDetails: true } });
    if(!visit || visit.type !== 'FOLLOW_UP' || !visit.generalDetails) return res.status(404).json({ error: 'Not found'});
    const gdId = visit.generalDetails.id;
    await prisma.$transaction(async (tx)=> {
      if(payload.date){ await tx.visit.update({ where: { id }, data: { date: new Date(payload.date) } }); }
      await tx.generalVisitDetails.update({ where: { id: gdId }, data: { notes: payload.notes ?? null, nextAppointmentDate: payload.nextAppointmentDate ? new Date(payload.nextAppointmentDate) : null } });
      if(payload.oralFindings){
        await tx.oralFindingOnVisit.deleteMany({ where: { generalVisitId: gdId } });
        if(payload.oralFindings.length){
          await tx.oralFindingOnVisit.createMany({ data: payload.oralFindings.map(o=> ({ generalVisitId: gdId, toothNumber: o.toothNumber, findingId: o.findingOptionId })) });
        }
      }
      if(payload.investigations){
        await tx.investigation.deleteMany({ where: { generalVisitId: gdId } });
        if(payload.investigations.length){
          await (tx.investigation as any).createMany({ data: payload.investigations.map(i=> ({ generalVisitId: gdId, typeOptionId: i.typeOptionId, findings: i.findings, toothNumber: i.toothNumber, imagePath: i.imagePath })) });
        }
      }
      if(payload.treatmentPlan){
        await tx.treatmentPlanItem.deleteMany({ where: { generalVisitId: gdId } });
        if(payload.treatmentPlan.length){
          await tx.treatmentPlanItem.createMany({ data: payload.treatmentPlan.map(t=> ({ generalVisitId: gdId, treatmentId: t.treatmentOptionId, toothNumber: t.toothNumber })) });
        }
      }
      if(payload.treatmentDone){
        await tx.treatmentDoneItem.deleteMany({ where: { generalVisitId: gdId } });
        if(payload.treatmentDone.length){
          await tx.treatmentDoneItem.createMany({ data: payload.treatmentDone.map(t=> ({ generalVisitId: gdId, treatmentId: t.treatmentOptionId, toothNumber: t.toothNumber, notes: t.notes })) });
        }
      }
      if(payload.prescriptions){
        await tx.prescription.deleteMany({ where: { visitId: id } });
        if(payload.prescriptions.length){
          await tx.prescription.createMany({ data: payload.prescriptions.map((p,idx)=> ({ visitId: id, slNo: idx+1, medicineId: p.medicineId, timing: p.timing, quantity: p.quantity, days: p.days, notes: p.notes })) });
        }
      }
    });
    const updated = await getVisitById(id);
    res.json(updated);
  } catch(e){ next(e); }
});

// --- Simple edit endpoints (limited fields for now) ---
const updateGeneralSchema = z.object({
  date: z.string().optional(),
  notes: z.string().optional(),
  nextAppointmentDate: z.string().optional()
});

router.patch('/general/:id', async (req,res,next)=> {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id'});
  try {
    const payload = updateGeneralSchema.parse(req.body);
    const visit = await prisma.visit.findUnique({ where: { id }, include: { generalDetails: true } });
    if(!visit || visit.type !== 'GENERAL') return res.status(404).json({ error: 'Not found'});
    const updated = await prisma.visit.update({
      where: { id },
      data: {
        date: payload.date ? new Date(payload.date) : visit.date,
        generalDetails: visit.generalDetails ? { update: { notes: payload.notes ?? visit.generalDetails.notes, nextAppointmentDate: payload.nextAppointmentDate ? new Date(payload.nextAppointmentDate) : visit.generalDetails.nextAppointmentDate } } : undefined
      },
  include: { generalDetails: { include: { complaints: { include: { complaint: true, quadrant: true } }, oralFindings: { include: { finding: true } }, investigations: true, treatmentPlans: { include: { treatment: true } }, treatmentsDone: { include: { treatment: true } } } }, prescriptions: { include: { medicine: true } } }
    });
    res.json(updated);
  } catch(e){ next(e); }
});

const updateFollowUpSchema = z.object({
  date: z.string().optional(),
  notes: z.string().optional(),
  nextAppointmentDate: z.string().optional()
});

router.patch('/follow-up/:id', async (req,res,next)=> {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id'});
  try {
    const payload = updateFollowUpSchema.parse(req.body);
    const visit = await prisma.visit.findUnique({ where: { id }, include: { generalDetails: true } });
    if(!visit || visit.type !== 'FOLLOW_UP') return res.status(404).json({ error: 'Not found'});
    const updated = await prisma.visit.update({
      where: { id },
      data: {
        date: payload.date ? new Date(payload.date) : visit.date,
        generalDetails: visit.generalDetails ? { update: { notes: payload.notes ?? visit.generalDetails.notes, nextAppointmentDate: payload.nextAppointmentDate ? new Date(payload.nextAppointmentDate) : visit.generalDetails.nextAppointmentDate } } : undefined
      },
  include: { followUpOf: { select: { id: true, date: true, type: true } }, generalDetails: { include: { oralFindings: { include: { finding: true } }, investigations: true, treatmentPlans: { include: { treatment: true } }, treatmentsDone: { include: { treatment: true } } } }, prescriptions: { include: { medicine: true } } }
    });
    res.json(updated);
  } catch(e){ next(e); }
});

router.get('/patient/:patientId', async (req, res, next) => {
  try {
    const patientId = Number(req.params.patientId);
    const visits = await listVisitsForPatient(patientId);
    res.json(visits);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const visit = await getVisitById(id);
    if (!visit) return res.status(404).json({ error: 'Not found' });
    res.json(visit);
  } catch (e) { next(e); }
});

// Upload media attachments
router.post('/:id/media', attachmentsUpload.array('files', 10), async (req, res, next) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid visit id' });
  try {
    const visit = await prisma.visit.findUnique({ where: { id }, select: { id: true } });
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    const files = (req as any).files as Express.Multer.File[];
    if (!files || !files.length) return res.status(400).json({ error: 'No files uploaded' });
    const created = await prisma.mediaAttachment.createMany({
      data: files.map(f => ({
        visitId: id,
        path: 'uploads/' + f.filename,
        originalName: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
        type: inferAttachmentType(f.mimetype, f.originalname)
      }))
    });
    const all = await prisma.mediaAttachment.findMany({ where: { visitId: id }, orderBy: { id: 'desc' } });
    res.status(201).json({ count: created.count, attachments: all });
  } catch (e) { next(e); }
});

// Delete a single media attachment
router.delete('/:visitId/media/:mediaId', async (req, res, next) => {
  const visitId = Number(req.params.visitId);
  const mediaId = Number(req.params.mediaId);
  if (isNaN(visitId) || isNaN(mediaId)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const media = await prisma.mediaAttachment.findUnique({ where: { id: mediaId } });
    if (!media || media.visitId !== visitId) return res.status(404).json({ error: 'Not found' });
    await prisma.mediaAttachment.delete({ where: { id: mediaId } });
    if (media.path) {
      const filePath = path.join(process.cwd(), 'server', media.path.replace(/^uploads[\/]/,''));
      fs.unlink(filePath, () => {}); // best-effort delete
    }
    res.status(204).send();
  } catch (e) { next(e); }
});

function inferAttachmentType(mime: string, name: string){
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  const lower = name.toLowerCase();
  if (lower.includes('xray')) return 'xray';
  return 'file';
}

router.delete('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const visit = await prisma.visit.findUnique({
      where: { id },
      select: {
        id: true,
        generalDetails: { select: { id: true } },
        followUps: { select: { id: true, generalDetails: { select: { id: true } } } }
      }
    });
    if (!visit) return res.status(404).json({ error: 'Not found' });

    // Guard: payments anywhere in chain
    const paymentCount = await prisma.payment.count({ where: { OR: [{ visitId: id }, { visit: { followUpOfId: id } }] } });
    if (paymentCount > 0) return res.status(400).json({ error: 'Cannot delete visit that has payments (including its follow-ups)' });

  await prisma.$transaction(async (tx) => {
      const followUpIds = visit.followUps.map((f: { id: number }) => f.id);
      const followUpDetailIds = visit.followUps
        .map((f: { generalDetails?: { id: number } | null }) => f.generalDetails?.id)
        .filter((x: number | undefined): x is number => !!x);
      const primaryDetailId = visit.generalDetails?.id;

      // Delete dependent records for follow-up details
      if (followUpIds.length) {
        // Child media & prescriptions
        await tx.mediaAttachment.deleteMany({ where: { visitId: { in: followUpIds } } });
        await tx.prescription.deleteMany({ where: { visitId: { in: followUpIds } } });
      }
      if (followUpDetailIds.length) {
        await tx.complaintOnVisit.deleteMany({ where: { generalVisitId: { in: followUpDetailIds } } });
        await tx.oralFindingOnVisit.deleteMany({ where: { generalVisitId: { in: followUpDetailIds } } });
        await tx.investigation.deleteMany({ where: { generalVisitId: { in: followUpDetailIds } } });
        await tx.treatmentPlanItem.deleteMany({ where: { generalVisitId: { in: followUpDetailIds } } });
        await tx.treatmentDoneItem.deleteMany({ where: { generalVisitId: { in: followUpDetailIds } } });
        await tx.generalVisitDetails.deleteMany({ where: { id: { in: followUpDetailIds } } });
      }
      if (followUpIds.length) {
        await tx.visit.deleteMany({ where: { id: { in: followUpIds } } });
      }

      // Delete dependent records for primary visit general details
      if (primaryDetailId) {
        await tx.complaintOnVisit.deleteMany({ where: { generalVisitId: primaryDetailId } });
        await tx.oralFindingOnVisit.deleteMany({ where: { generalVisitId: primaryDetailId } });
        await tx.investigation.deleteMany({ where: { generalVisitId: primaryDetailId } });
        await tx.treatmentPlanItem.deleteMany({ where: { generalVisitId: primaryDetailId } });
        await tx.treatmentDoneItem.deleteMany({ where: { generalVisitId: primaryDetailId } });
        await tx.generalVisitDetails.delete({ where: { id: primaryDetailId } });
      }

      // Primary visit media & prescriptions
      await tx.mediaAttachment.deleteMany({ where: { visitId: id } });
      await tx.prescription.deleteMany({ where: { visitId: id } });

      await tx.visit.delete({ where: { id } });
    });
    res.status(204).send();
  } catch (e) {
    console.error('Error deleting visit', id, e);
    next(e);
  }
});

export default router;
