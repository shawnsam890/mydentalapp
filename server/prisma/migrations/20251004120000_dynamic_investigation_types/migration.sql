-- Manual migration: convert Investigation.type enum to foreign key Investigation.typeOptionId
PRAGMA foreign_keys=OFF;

-- 1. Create new table InvestigationTypeOption
CREATE TABLE "InvestigationTypeOption" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "label" TEXT NOT NULL UNIQUE,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seed existing enum values into option table
INSERT INTO "InvestigationTypeOption" (label) VALUES ('IOPAR'), ('OPG'), ('CBCT');

-- 3. Create new temp Investigation table with typeOptionId
CREATE TABLE "new_Investigation" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "generalVisitId" INTEGER NOT NULL,
  "typeOptionId" INTEGER NOT NULL,
  "findings" TEXT,
  "toothNumber" TEXT,
  "imagePath" TEXT,
  CONSTRAINT "new_Investigation_generalVisitId_fkey" FOREIGN KEY ("generalVisitId") REFERENCES "GeneralVisitDetails" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "new_Investigation_typeOptionId_fkey" FOREIGN KEY ("typeOptionId") REFERENCES "InvestigationTypeOption" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 4. Copy data mapping old enum text to new id
INSERT INTO "new_Investigation" (id, generalVisitId, typeOptionId, findings, toothNumber, imagePath)
SELECT i.id, i.generalVisitId,
  (SELECT ito.id FROM InvestigationTypeOption ito WHERE ito.label = i.type ) as typeOptionId,
  i.findings, i.toothNumber, i.imagePath
FROM Investigation i;

-- 5. Drop old table and rename
DROP TABLE "Investigation";
ALTER TABLE "new_Investigation" RENAME TO "Investigation";

-- 6. Indices (if needed in future we can add). For now none.

PRAGMA foreign_keys=ON;
