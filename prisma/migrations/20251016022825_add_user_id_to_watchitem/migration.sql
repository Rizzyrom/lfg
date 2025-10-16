/*
  Warnings:

  - Added the required column `userId` to the `WatchItem` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add userId column as nullable first
ALTER TABLE "WatchItem" ADD COLUMN "userId" TEXT;

-- Step 2: Update existing rows with the group creator's userId
UPDATE "WatchItem"
SET "userId" = (
  SELECT "createdById"
  FROM "Group"
  WHERE "Group"."id" = "WatchItem"."groupId"
  LIMIT 1
);

-- Step 3: Make the column NOT NULL
ALTER TABLE "WatchItem" ALTER COLUMN "userId" SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE "WatchItem" ADD CONSTRAINT "WatchItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
