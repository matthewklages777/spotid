-- CreateTable
CREATE TABLE "ProfileViewStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileViewStat_userId_date_key" ON "ProfileViewStat"("userId", "date");
