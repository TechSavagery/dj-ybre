-- AlterTable
ALTER TABLE "song_request_lists" ADD COLUMN     "publicDescription" TEXT;

-- AlterTable
ALTER TABLE "song_request_tracks" ADD COLUMN     "requesterSessionKey" TEXT;

-- CreateIndex
CREATE INDEX "song_request_tracks_listId_requesterSessionKey_idx" ON "song_request_tracks"("listId", "requesterSessionKey");

