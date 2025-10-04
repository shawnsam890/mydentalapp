-- CreateTable
CREATE TABLE "Patient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "displayNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "sex" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patientId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followUpOfId" INTEGER,
    CONSTRAINT "Visit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Visit_followUpOfId_fkey" FOREIGN KEY ("followUpOfId") REFERENCES "Visit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneralVisitDetails" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "visitId" INTEGER NOT NULL,
    "notes" TEXT,
    CONSTRAINT "GeneralVisitDetails_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplaintOption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "QuadrantOption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ComplaintOnVisit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "generalVisitId" INTEGER NOT NULL,
    "complaintId" INTEGER NOT NULL,
    "quadrantId" INTEGER NOT NULL,
    CONSTRAINT "ComplaintOnVisit_generalVisitId_fkey" FOREIGN KEY ("generalVisitId") REFERENCES "GeneralVisitDetails" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ComplaintOnVisit_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "ComplaintOption" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ComplaintOnVisit_quadrantId_fkey" FOREIGN KEY ("quadrantId") REFERENCES "QuadrantOption" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OralFindingOption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "OralFindingOnVisit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "generalVisitId" INTEGER NOT NULL,
    "toothNumber" TEXT NOT NULL,
    "findingId" INTEGER NOT NULL,
    CONSTRAINT "OralFindingOnVisit_generalVisitId_fkey" FOREIGN KEY ("generalVisitId") REFERENCES "GeneralVisitDetails" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OralFindingOnVisit_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "OralFindingOption" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "generalVisitId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "findings" TEXT,
    "toothNumber" TEXT,
    "imagePath" TEXT,
    CONSTRAINT "Investigation_generalVisitId_fkey" FOREIGN KEY ("generalVisitId") REFERENCES "GeneralVisitDetails" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TreatmentOption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL,
    "category" TEXT
);

-- CreateTable
CREATE TABLE "TreatmentPlanItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "generalVisitId" INTEGER NOT NULL,
    "treatmentId" INTEGER NOT NULL,
    CONSTRAINT "TreatmentPlanItem_generalVisitId_fkey" FOREIGN KEY ("generalVisitId") REFERENCES "GeneralVisitDetails" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TreatmentPlanItem_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "TreatmentOption" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "visitId" INTEGER NOT NULL,
    "slNo" INTEGER NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "timing" TEXT,
    "quantity" INTEGER,
    "days" INTEGER,
    "notes" TEXT,
    CONSTRAINT "Prescription_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Prescription_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "OrthodonticPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "visitId" INTEGER NOT NULL,
    "bracketType" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "doctorName" TEXT,
    "consentPath" TEXT,
    CONSTRAINT "OrthodonticPlan_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrthodonticTreatment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "treatmentLabel" TEXT NOT NULL,
    "mediaPath" TEXT,
    CONSTRAINT "OrthodonticTreatment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "OrthodonticPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RootCanalPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "visitId" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "consentPath" TEXT,
    CONSTRAINT "RootCanalPlan_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RootCanalProcedure" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "procedureLabel" TEXT NOT NULL,
    "mediaPath" TEXT,
    CONSTRAINT "RootCanalProcedure_planId_fkey" FOREIGN KEY ("planId") REFERENCES "RootCanalPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LabWork" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patientId" INTEGER NOT NULL,
    "labName" TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    "shade" TEXT,
    "expectedDelivery" DATETIME,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "LabWork_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaAttachment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "visitId" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "type" TEXT,
    CONSTRAINT "MediaAttachment_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patientId" INTEGER NOT NULL,
    "visitId" INTEGER,
    "amount" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT,
    "note" TEXT,
    "orthoTreatmentId" INTEGER,
    "rootCanalProcedureId" INTEGER,
    "labWorkId" INTEGER,
    CONSTRAINT "Payment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_orthoTreatmentId_fkey" FOREIGN KEY ("orthoTreatmentId") REFERENCES "OrthodonticTreatment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_rootCanalProcedureId_fkey" FOREIGN KEY ("rootCanalProcedureId") REFERENCES "RootCanalProcedure" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_labWorkId_fkey" FOREIGN KEY ("labWorkId") REFERENCES "LabWork" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "role" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_displayNumber_key" ON "Patient"("displayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralVisitDetails_visitId_key" ON "GeneralVisitDetails"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplaintOption_label_key" ON "ComplaintOption"("label");

-- CreateIndex
CREATE UNIQUE INDEX "QuadrantOption_code_key" ON "QuadrantOption"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OralFindingOption_label_key" ON "OralFindingOption"("label");

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentOption_label_key" ON "TreatmentOption"("label");

-- CreateIndex
CREATE UNIQUE INDEX "Medicine_name_key" ON "Medicine"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OrthodonticPlan_visitId_key" ON "OrthodonticPlan"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "RootCanalPlan_visitId_key" ON "RootCanalPlan"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orthoTreatmentId_key" ON "Payment"("orthoTreatmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_rootCanalProcedureId_key" ON "Payment"("rootCanalProcedureId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_labWorkId_key" ON "Payment"("labWorkId");
