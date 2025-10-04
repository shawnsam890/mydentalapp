import { Router } from 'express';
import { listComplaintOptions, listQuadrantOptions, listOralFindingOptions, listTreatmentOptions, listMedicines, listInvestigationTypeOptions, listDentalHistoryOptions, listMedicalHistoryOptions, listAllergyOptions, createComplaintOption, createOralFindingOption, createTreatmentOption, createMedicine, createInvestigationTypeOption, createDentalHistoryOption, createMedicalHistoryOption, createAllergyOption } from '../services/optionsService';
import { z } from 'zod';

const router = Router();

router.get('/complaints', async (_req, res, next) => {
  try { res.json(await listComplaintOptions()); } catch (e) { next(e); }
});
router.get('/quadrants', async (_req, res, next) => {
  try { res.json(await listQuadrantOptions()); } catch (e) { next(e); }
});
router.get('/oral-findings', async (_req, res, next) => {
  try { res.json(await listOralFindingOptions()); } catch (e) { next(e); }
});
router.get('/treatments', async (_req, res, next) => {
  try { res.json(await listTreatmentOptions()); } catch (e) { next(e); }
});
router.get('/medicines', async (_req, res, next) => {
  try { res.json(await listMedicines()); } catch (e) { next(e); }
});
router.get('/investigation-types', async (_req, res, next) => {
  try { res.json(await listInvestigationTypeOptions()); } catch (e) { next(e); }
});

// Patient history/allergy options
router.get('/dental-history', async (_req,res,next)=> { try { res.json(await listDentalHistoryOptions()); } catch(e){ next(e); }});
router.get('/medical-history', async (_req,res,next)=> { try { res.json(await listMedicalHistoryOptions()); } catch(e){ next(e); }});
router.get('/allergies', async (_req,res,next)=> { try { res.json(await listAllergyOptions()); } catch(e){ next(e); }});

const createSchema = z.object({ label: z.string().min(1).max(120) });
const createTreatmentSchema = z.object({ label: z.string().min(1).max(120), category: z.string().optional() });
const createMedicineSchema = z.object({ name: z.string().min(1).max(120) });

// POST endpoints for all option types
router.post('/complaints', async (req,res,next)=> { try { const { label } = createSchema.parse(req.body); res.status(201).json(await createComplaintOption(label)); } catch(e){ next(e);} });
router.post('/oral-findings', async (req,res,next)=> { try { const { label } = createSchema.parse(req.body); res.status(201).json(await createOralFindingOption(label)); } catch(e){ next(e);} });
router.post('/treatments', async (req,res,next)=> { try { const { label, category } = createTreatmentSchema.parse(req.body); res.status(201).json(await createTreatmentOption(label, category)); } catch(e){ next(e);} });
router.post('/medicines', async (req,res,next)=> { try { const { name } = createMedicineSchema.parse(req.body); res.status(201).json(await createMedicine(name)); } catch(e){ next(e);} });
router.post('/investigation-types', async (req,res,next)=> { try { const { label } = createSchema.parse(req.body); res.status(201).json(await createInvestigationTypeOption(label)); } catch(e){ next(e);} });
router.post('/dental-history', async (req,res,next)=> { try { const { label } = createSchema.parse(req.body); res.status(201).json(await createDentalHistoryOption(label)); } catch(e){ next(e);} });
router.post('/medical-history', async (req,res,next)=> { try { const { label } = createSchema.parse(req.body); res.status(201).json(await createMedicalHistoryOption(label)); } catch(e){ next(e);} });
router.post('/allergies', async (req,res,next)=> { try { const { label } = createSchema.parse(req.body); res.status(201).json(await createAllergyOption(label)); } catch(e){ next(e);} });

export default router;
