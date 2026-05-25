-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "image" TEXT,
    "coverImage" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "occupation" TEXT,
    "dob" TEXT,
    "username" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "twitter" TEXT,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "openToContact" BOOLEAN NOT NULL DEFAULT true,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "emailMessages" BOOLEAN NOT NULL DEFAULT true,
    "emailTagFollows" BOOLEAN NOT NULL DEFAULT true,
    "emailDigest" BOOLEAN NOT NULL DEFAULT true,
    "emailFollowers" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "premiumSince" DATETIME,
    "stripeCustomerId" TEXT,
    "stripeSubId" TEXT,
    "browseAnonymously" BOOLEAN NOT NULL DEFAULT false,
    "referralCode" TEXT,
    "referredBy" TEXT,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("banned", "bio", "browseAnonymously", "coverImage", "createdAt", "dob", "email", "emailDigest", "emailFollowers", "emailMessages", "emailTagFollows", "emailVerified", "id", "image", "instagram", "isPremium", "location", "name", "occupation", "onboardingComplete", "openToContact", "password", "phone", "premiumSince", "profileViews", "stripeCustomerId", "stripeSubId", "tiktok", "twitter", "updatedAt", "username", "website") SELECT "banned", "bio", "browseAnonymously", "coverImage", "createdAt", "dob", "email", "emailDigest", "emailFollowers", "emailMessages", "emailTagFollows", "emailVerified", "id", "image", "instagram", "isPremium", "location", "name", "occupation", "onboardingComplete", "openToContact", "password", "phone", "premiumSince", "profileViews", "stripeCustomerId", "stripeSubId", "tiktok", "twitter", "updatedAt", "username", "website" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
