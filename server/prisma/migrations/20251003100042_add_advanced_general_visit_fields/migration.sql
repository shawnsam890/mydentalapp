-- AlterTable
ALTER TABLE "GeneralVisitDetails" ADD COLUMN "nextAppointmentDate" DATETIME;

-- AlterTable
ALTER TABLE "TreatmentPlanItem" ADD COLUMN "toothNumber" TEXT;

-- CreateTable
CREATE TABLE "TreatmentDoneItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "generalVisitId" INTEGER NOT NULL,
    "treatmentId" INTEGER NOT NULL,
    "toothNumber" TEXT,
    "notes" TEXT,
    CONSTRAINT "TreatmentDoneItem_generalVisitId_fkey" FOREIGN KEY ("generalVisitId") REFERENCES "GeneralVisitDetails" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TreatmentDoneItem_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "TreatmentOption" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
