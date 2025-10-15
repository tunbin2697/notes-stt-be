-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('NOTE', 'TASK', 'TODO', 'REMINDER');

-- CreateEnum
CREATE TYPE "NotePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NoteStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "public"."Note" DROP CONSTRAINT "Note_profileId_fkey";

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "color" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" "NotePriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "status" "NoteStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "type" "NoteType" NOT NULL DEFAULT 'NOTE';

-- CreateIndex
CREATE INDEX "Note_profileId_idx" ON "Note"("profileId");

-- CreateIndex
CREATE INDEX "Note_type_idx" ON "Note"("type");

-- CreateIndex
CREATE INDEX "Note_status_idx" ON "Note"("status");

-- CreateIndex
CREATE INDEX "Note_dueDate_idx" ON "Note"("dueDate");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
