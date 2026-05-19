-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FollowedHashtag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FollowedHashtag_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FollowedHashtag" ("createdAt", "hashtagId", "id", "userId") SELECT "createdAt", "hashtagId", "id", "userId" FROM "FollowedHashtag";
DROP TABLE "FollowedHashtag";
ALTER TABLE "new_FollowedHashtag" RENAME TO "FollowedHashtag";
CREATE UNIQUE INDEX "FollowedHashtag_userId_hashtagId_key" ON "FollowedHashtag"("userId", "hashtagId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
