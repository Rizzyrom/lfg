-- CreateTable
CREATE TABLE "TickerMention" (
    "symbol" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastMentionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TickerMention_pkey" PRIMARY KEY ("symbol","source","groupId")
);

-- CreateIndex
CREATE INDEX "TickerMention_groupId_count_idx" ON "TickerMention"("groupId", "count");
