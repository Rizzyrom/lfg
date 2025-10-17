-- CreateTable
CREATE TABLE "TweetSnapshot" (
    "tweetId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "retweets" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TweetSnapshot_pkey" PRIMARY KEY ("tweetId")
);

-- CreateIndex
CREATE INDEX "TweetSnapshot_isAvailable_idx" ON "TweetSnapshot"("isAvailable");

-- CreateIndex
CREATE INDEX "TweetSnapshot_validatedAt_idx" ON "TweetSnapshot"("validatedAt");
