-- AlterTable
ALTER TABLE "playlist_tracks" ADD COLUMN     "reccoBeatsId" TEXT;

-- AlterTable
ALTER TABLE "transition_tracks" ADD COLUMN     "reccoBeatsId" TEXT;

-- AlterTable
ALTER TABLE "transitions" ALTER COLUMN "type" SET DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "playlist_tracks_reccoBeatsId_idx" ON "playlist_tracks"("reccoBeatsId");

-- CreateIndex
CREATE INDEX "transition_tracks_reccoBeatsId_idx" ON "transition_tracks"("reccoBeatsId");
