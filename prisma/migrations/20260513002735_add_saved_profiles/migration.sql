-- CreateTable
CREATE TABLE "SavedProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saverId" TEXT NOT NULL,
    "savedUserId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedProfile_saverId_savedUserId_key" ON "SavedProfile"("saverId", "savedUserId");
