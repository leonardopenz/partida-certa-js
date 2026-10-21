-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('admin', 'member');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('scheduled', 'canceled');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('society', 'futsal', 'campo');

-- CreateEnum
CREATE TYPE "PresenceStatus" AS ENUM ('confirmed', 'canceled');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000) NOT NULL DEFAULT '',
    "city" VARCHAR(100) NOT NULL DEFAULT '',
    "teamCount" INTEGER NOT NULL DEFAULT 2,
    "inviteToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "groupId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("groupId","userId")
);

-- CreateTable
CREATE TABLE "FootballMatch" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "type" "MatchType" NOT NULL DEFAULT 'society',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "minPlayers" INTEGER NOT NULL DEFAULT 10,
    "maxPlayers" INTEGER NOT NULL DEFAULT 20,
    "location" VARCHAR(300) NOT NULL,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "notes" VARCHAR(1000) NOT NULL DEFAULT '',
    "presenceToken" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FootballMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchPresence" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "userId" UUID,
    "guestName" VARCHAR(100),
    "cancelHash" TEXT,
    "status" "PresenceStatus" NOT NULL DEFAULT 'confirmed',
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchPresence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchTeam" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MatchTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPlayer" (
    "teamId" UUID NOT NULL,
    "presenceId" UUID NOT NULL,

    CONSTRAINT "TeamPlayer_pkey" PRIMARY KEY ("teamId","presenceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_inviteToken_key" ON "Group"("inviteToken");

-- CreateIndex
CREATE INDEX "Group_ownerId_idx" ON "Group"("ownerId");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FootballMatch_presenceToken_key" ON "FootballMatch"("presenceToken");

-- CreateIndex
CREATE INDEX "FootballMatch_groupId_scheduledAt_idx" ON "FootballMatch"("groupId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "MatchPresence_cancelHash_key" ON "MatchPresence"("cancelHash");

-- CreateIndex
CREATE INDEX "MatchPresence_matchId_status_idx" ON "MatchPresence"("matchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MatchPresence_matchId_userId_key" ON "MatchPresence"("matchId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchTeam_matchId_name_key" ON "MatchTeam"("matchId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPlayer_presenceId_key" ON "TeamPlayer"("presenceId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FootballMatch" ADD CONSTRAINT "FootballMatch_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPresence" ADD CONSTRAINT "MatchPresence_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "FootballMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPresence" ADD CONSTRAINT "MatchPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchTeam" ADD CONSTRAINT "MatchTeam_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "FootballMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer" ADD CONSTRAINT "TeamPlayer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "MatchTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer" ADD CONSTRAINT "TeamPlayer_presenceId_fkey" FOREIGN KEY ("presenceId") REFERENCES "MatchPresence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
