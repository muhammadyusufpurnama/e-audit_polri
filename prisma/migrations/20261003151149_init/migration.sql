-- CreateTable
CREATE TABLE "divisions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Settings',
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "regulations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "divisionId" INTEGER NOT NULL,
    "regulationType" TEXT NOT NULL,
    "regulationNumber" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "regulations_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "regulationId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL DEFAULT '',
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "extractedText" TEXT NOT NULL DEFAULT '',
    "uploadStatus" TEXT NOT NULL DEFAULT 'UPLOADED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documents_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "regulations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "norms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "regulationId" INTEGER NOT NULL,
    "normCode" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    "article" TEXT NOT NULL,
    "paragraph" TEXT,
    "originalText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "norms_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "regulations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "normId" INTEGER NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "maximumValue" REAL,
    "operator" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "inspectionIndicator" TEXT NOT NULL,
    "minimumValue" REAL,
    "unit" TEXT NOT NULL DEFAULT '',
    "textThreshold" TEXT NOT NULL DEFAULT '',
    "numericValue" REAL,
    "ruleType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rules_normId_fkey" FOREIGN KEY ("normId") REFERENCES "norms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL DEFAULT 'system',
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "divisions_key_key" ON "divisions"("key");

-- CreateIndex
CREATE INDEX "regulations_divisionId_idx" ON "regulations"("divisionId");

-- CreateIndex
CREATE INDEX "regulations_status_idx" ON "regulations"("status");

-- CreateIndex
CREATE INDEX "documents_regulationId_idx" ON "documents"("regulationId");

-- CreateIndex
CREATE UNIQUE INDEX "norms_normCode_key" ON "norms"("normCode");

-- CreateIndex
CREATE INDEX "norms_regulationId_idx" ON "norms"("regulationId");

-- CreateIndex
CREATE INDEX "norms_status_idx" ON "norms"("status");

-- CreateIndex
CREATE UNIQUE INDEX "rules_ruleCode_key" ON "rules"("ruleCode");

-- CreateIndex
CREATE INDEX "rules_normId_idx" ON "rules"("normId");

-- CreateIndex
CREATE INDEX "rules_status_idx" ON "rules"("status");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
