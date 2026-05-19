-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InterestTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterestTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InterestTag_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InterestTag" ("createdAt", "hashtagId", "id", "userId") SELECT "createdAt", "hashtagId", "id", "userId" FROM "InterestTag";
DROP TABLE "InterestTag";
ALTER TABLE "new_InterestTag" RENAME TO "InterestTag";
CREATE UNIQUE INDEX "InterestTag_userId_hashtagId_key" ON "InterestTag"("userId", "hashtagId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
