// Shared front-end domain types (subset / shape from backend API responses)
export interface Patient {
  id: number;
  displayNumber: number;
  name: string;
  age?: number;
  sex: 'M' | 'F' | 'Other';
  address?: string;
  phone?: string;
  email?: string;
  whatsapp: boolean;
}

export interface ComplaintOption { id: number; label: string; }
export interface QuadrantOption { id: number; code: string; }
export interface OralFindingOption { id: number; label: string; }
export interface TreatmentOption { id: number; label: string; category?: string | null; }
export interface Medicine { id: number; name: string; }
export interface InvestigationTypeOption { id: number; label: string; }
export interface DentalHistoryOption { id: number; label: string; }
export interface MedicalHistoryOption { id: number; label: string; }
export interface AllergyOption { id: number; label: string; }

// Join item shapes returned in patient full response (include option)
export interface PatientDentalHistoryItem { id: number; option: DentalHistoryOption; }
export interface PatientMedicalHistoryItem { id: number; option: MedicalHistoryOption; }
export interface PatientAllergyItem { id: number; option: AllergyOption; }

export interface GeneralComplaintItem { id: number; complaintId: number; quadrantId: number; }
export interface OralFindingItem { id: number; toothNumber: string; findingId: number; }
export interface InvestigationItem { id: number; typeOption: InvestigationTypeOption; findings?: string; toothNumber?: string; imagePath?: string; }
export interface TreatmentPlanItem { id: number; treatmentId: number; toothNumber?: string | null; }
export interface TreatmentDoneItem { id: number; treatmentId: number; toothNumber?: string | null; notes?: string | null; }
export interface Prescription { id: number; slNo: number; medicineId: number; timing?: string | null; quantity?: number | null; days?: number | null; notes?: string | null; }
export interface MediaAttachment { id: number; path: string; originalName?: string | null; mimeType?: string | null; size?: number | null; type?: string | null; createdAt?: string; }

export interface GeneralVisitDetails {
  id: number;
  notes?: string;
  nextAppointmentDate?: string | null;
  complaints: GeneralComplaintItem[];
  oralFindings: OralFindingItem[];
  investigations: InvestigationItem[];
  treatmentPlans: TreatmentPlanItem[];
  treatmentsDone: TreatmentDoneItem[];
}

export interface Visit {
  id: number;
  patientId: number;
  type: 'GENERAL' | 'ORTHODONTIC' | 'ROOT_CANAL' | 'FOLLOW_UP';
  date: string;
  generalDetails?: GeneralVisitDetails | null;
  prescriptions?: Prescription[];
  media?: MediaAttachment[];
  followUpOf?: { id: number; date: string; type: string } | null;
  followUps?: { id: number }[]; // minimal for now
  orthodonticPlan?: OrthodonticPlan | null;
  rootCanalPlan?: RootCanalPlan | null;
}

export interface OrthodonticTreatment {
  id: number;
  orthodonticPlanId: number;
  date: string;
  treatmentLabel: string;
}

export interface OrthodonticPlan {
  id: number;
  bracketType: 'METAL_REGULAR' | 'METAL_PREMIUM';
  totalAmount: number;
  doctorName?: string | null;
  treatments: OrthodonticTreatment[];
}

export interface RootCanalProcedure {
  id: number;
  planId: number;
  date: string;
  procedureLabel: string;
}

export interface RootCanalPlan {
  id: number;
  totalAmount: number;
  procedures: RootCanalProcedure[];
}

export interface Payment {
  id: number;
  patientId: number;
  visitId?: number | null;
  amount: number;
  date: string;
  method?: string | null;
  note?: string | null;
  visit?: { id: number; date: string; type: string } | null;
}

export interface SummaryResponse {
  totalPatients: number;
  totalRevenue: number;
  pendingLabWorks: number;
}

export interface PatientFullResponse {
  patient: Patient;
  visits: Visit[];
  payments: Payment[];
  totalPaid: number;
  dentalHistory: PatientDentalHistoryItem[];
  medicalHistory: PatientMedicalHistoryItem[];
  allergies: PatientAllergyItem[];
}

// Input payloads
export interface CreateGeneralVisitPayload {
  patientId: number;
  notes?: string;
  nextAppointmentDate?: string;
  complaints?: { complaintOptionId: number; quadrantOptionId: number }[];
  oralFindings?: { toothNumber: string; findingOptionId: number }[];
  treatmentPlan?: { treatmentOptionId: number; toothNumber?: string }[];
  treatmentDone?: { treatmentOptionId: number; toothNumber?: string; notes?: string }[];
  prescriptions?: { medicineId: number; timing?: string; quantity?: number; days?: number; notes?: string }[];
  investigations?: { typeOptionId: number; findings?: string; toothNumber?: string; }[];
}