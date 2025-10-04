# Dental Clinic App

## New Patient History & Allergy Feature

This update introduces structured multi-select histories for each patient:

- Past Dental History
- Past Medical History
- Drug Allergies

Each category has its own option set that you can manage (create new options) via the UI at `/options`.

### Data Model (Prisma)

Tables added:
- DentalHistoryOption / PatientDentalHistory (join)
- MedicalHistoryOption / PatientMedicalHistory (join)
- AllergyOption / PatientAllergy (join)

All option tables: `id`, `label (unique)`, `active`, `createdAt`.
Join tables enforce uniqueness on `(patientId, optionId)`.

### API Endpoints

Option management:
- GET `/api/options/dental-history` -> list active dental history options
- POST `/api/options/dental-history` { label }
- GET `/api/options/medical-history`
- POST `/api/options/medical-history` { label }
- GET `/api/options/allergies`
- POST `/api/options/allergies` { label }

Patient history patch:
- PATCH `/api/patients/:id/history` { dentalHistoryIds?: number[], medicalHistoryIds?: number[], allergyIds?: number[] }
  - Replaces each provided category atomically inside a transaction.

Patient full details now include three arrays:
```
{
  dentalHistory: { id, option: { id, label, active, createdAt } }[],
  medicalHistory: [...],
  allergies: [...]
}
```

### Front-End Usage

`PatientDetail` page displays a Patient History card with three multi-select pickers:
- Click "Select" to open a dropdown of checkboxes.
- Add a new option inline with the input + Add button.
- Remove a selected chip with the × icon.
- Click Save to persist (PATCH request). A small Saved message appears on success.

Option Management Page (`/options`): simple panel listing each category and allowing creation of new options.

### Dev Notes
- Added new Prisma models; run `npx prisma migrate dev` if schema changes.
- After migrations, regenerate client: `npx prisma generate`.
- Multi-select UI implemented with lightweight state + React Query invalidation.

### Follow Ups / Future Ideas
- Deactivate (soft delete) options instead of hard using `active` flag toggle endpoint (not yet implemented).
- Audit trail for when a history/allergy was first added.
- Bulk option import.
- Filtering patients by a specific history/allergy.

