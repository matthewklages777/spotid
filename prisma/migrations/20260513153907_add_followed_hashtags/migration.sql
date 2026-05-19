-- CreateTable
CREATE TABLE "FollowedHashtag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "FollowedHashtag_userId_hashtagId_key" ON "FollowedHashtag"("userId", "hashtagId");
