-- CreateTable
CREATE TABLE "song_request_lists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TEXT NOT NULL,
    "eventTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "song_request_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_request_tracks" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "reccoBeatsId" TEXT,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "artists" JSONB,
    "album" TEXT,
    "albumImage" TEXT,
    "duration" INTEGER NOT NULL,
    "previewUrl" TEXT,
    "externalUrl" TEXT,
    "bpm" DOUBLE PRECISION,
    "key" INTEGER,
    "mode" INTEGER,
    "timeSignature" INTEGER,
    "energy" DOUBLE PRECISION,
    "danceability" DOUBLE PRECISION,
    "valence" DOUBLE PRECISION,
    "audioFeatures" JSONB,
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "releaseDate" TEXT,
    "popularity" INTEGER,
    "requesterFirstName" TEXT NOT NULL,
    "requesterLastName" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "song_request_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_request_votes" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "song_request_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "song_request_lists_createdAt_idx" ON "song_request_lists"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "song_request_tracks_listId_spotifyId_key" ON "song_request_tracks"("listId", "spotifyId");

-- CreateIndex
CREATE INDEX "song_request_tracks_listId_idx" ON "song_request_tracks"("listId");

-- CreateIndex
CREATE INDEX "song_request_tracks_spotifyId_idx" ON "song_request_tracks"("spotifyId");

-- CreateIndex
CREATE INDEX "song_request_tracks_reccoBeatsId_idx" ON "song_request_tracks"("reccoBeatsId");

-- CreateIndex
CREATE INDEX "song_request_tracks_voteCount_idx" ON "song_request_tracks"("voteCount");

-- CreateIndex
CREATE UNIQUE INDEX "song_request_votes_requestId_sessionKey_key" ON "song_request_votes"("requestId", "sessionKey");

-- CreateIndex
CREATE INDEX "song_request_votes_requestId_idx" ON "song_request_votes"("requestId");

-- AddForeignKey
ALTER TABLE "song_request_tracks" ADD CONSTRAINT "song_request_tracks_listId_fkey" FOREIGN KEY ("listId") REFERENCES "song_request_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_request_votes" ADD CONSTRAINT "song_request_votes_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "song_request_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
