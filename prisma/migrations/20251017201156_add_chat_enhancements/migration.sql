-- CreateTable
CREATE TABLE "SystemEvent" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "args" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatContextSetting" (
    "groupId" TEXT NOT NULL,
    "contextEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatContextSetting_pkey" PRIMARY KEY ("groupId")
);

-- CreateTable
CREATE TABLE "SocialFeedSource" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "platformId" TEXT,
    "addedById" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialFeedSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatAlert" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "targetSymbol" TEXT,
    "targetKeyword" TEXT,
    "threshold" DECIMAL(65,30),
    "direction" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatPin" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "pinnedBy" TEXT NOT NULL,
    "pinnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatPin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemEvent_groupId_createdAt_idx" ON "SystemEvent"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "SocialFeedSource_groupId_idx" ON "SocialFeedSource"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialFeedSource_groupId_platform_handle_key" ON "SocialFeedSource"("groupId", "platform", "handle");

-- CreateIndex
CREATE INDEX "ChatAlert_groupId_isActive_idx" ON "ChatAlert"("groupId", "isActive");

-- CreateIndex
CREATE INDEX "ChatAlert_userId_idx" ON "ChatAlert"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatPin_messageId_key" ON "ChatPin"("messageId");

-- CreateIndex
CREATE INDEX "ChatPin_groupId_pinnedAt_idx" ON "ChatPin"("groupId", "pinnedAt");
