-- CreateTable
CREATE TABLE "DailyProfileReaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dailyProfileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyProfileReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailyProfileReaction_dailyProfileId_fkey" FOREIGN KEY ("dailyProfileId") REFERENCES "DailyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyProfileReaction_userId_dailyProfileId_key" ON "DailyProfileReaction"("userId", "dailyProfileId");
