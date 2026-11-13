-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Paper" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT NOT NULL,
    "authorLine" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "reviewNote" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'PAPER',
    "subtitle" TEXT,
    "body" TEXT,
    "topics" TEXT,
    "storedName" TEXT,
    "originalName" TEXT,
    "fileSize" INTEGER,
    "coverImage" TEXT,
    "submitterId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    "publishedAt" DATETIME,
    CONSTRAINT "Paper_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Paper_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Paper" ("abstract", "authorLine", "coverImage", "createdAt", "fileSize", "id", "originalName", "publishedAt", "reviewNote", "reviewerId", "slug", "status", "storedName", "submittedAt", "submitterId", "title", "updatedAt") SELECT "abstract", "authorLine", "coverImage", "createdAt", "fileSize", "id", "originalName", "publishedAt", "reviewNote", "reviewerId", "slug", "status", "storedName", "submittedAt", "submitterId", "title", "updatedAt" FROM "Paper";
DROP TABLE "Paper";
ALTER TABLE "new_Paper" RENAME TO "Paper";
CREATE UNIQUE INDEX "Paper_slug_key" ON "Paper"("slug");
CREATE INDEX "Paper_status_publishedAt_idx" ON "Paper"("status", "publishedAt");
CREATE INDEX "Paper_submitterId_idx" ON "Paper"("submitterId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
