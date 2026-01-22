-- CreateTable
CREATE TABLE "playlist_sessions" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "playlistDuration" INTEGER NOT NULL,
    "graduationYear1" INTEGER,
    "graduationYear2" INTEGER,
    "hometown1" TEXT,
    "hometown2" TEXT,
    "college1" TEXT,
    "college2" TEXT,
    "lastConcert1" TEXT,
    "lastConcert2" TEXT,
    "lastConcert3" TEXT,
    "eventDescription" TEXT,
    "inspirationTracks" JSONB,
    "inspirationArtists" JSONB,
    "targetDuration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlist_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_tracks" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT,
    "duration" INTEGER NOT NULL,
    "previewUrl" TEXT,
    "imageUrl" TEXT,
    "externalUrl" TEXT,
    "order" INTEGER,
    "isHearted" BOOLEAN NOT NULL DEFAULT false,
    "isRemoved" BOOLEAN NOT NULL DEFAULT false,
    "audioFeatures" JSONB,
    "genres" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_interactions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "stemsNotes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transition_tracks" (
    "id" TEXT NOT NULL,
    "transitionId" TEXT NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "fromTrackId" TEXT,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transition_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transition_points" (
    "id" TEXT NOT NULL,
    "transitionId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "timestamp" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "pointType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transition_points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "playlist_tracks_spotifyId_key" ON "playlist_tracks"("spotifyId");

-- CreateIndex
CREATE INDEX "playlist_tracks_sessionId_idx" ON "playlist_tracks"("sessionId");

-- CreateIndex
CREATE INDEX "playlist_tracks_spotifyId_idx" ON "playlist_tracks"("spotifyId");

-- CreateIndex
CREATE INDEX "user_interactions_sessionId_idx" ON "user_interactions"("sessionId");

-- CreateIndex
CREATE INDEX "user_interactions_trackId_idx" ON "user_interactions"("trackId");

-- CreateIndex
CREATE INDEX "transitions_type_idx" ON "transitions"("type");

-- CreateIndex
CREATE INDEX "transitions_createdAt_idx" ON "transitions"("createdAt");

-- CreateIndex
CREATE INDEX "transition_tracks_transitionId_idx" ON "transition_tracks"("transitionId");

-- CreateIndex
CREATE INDEX "transition_tracks_spotifyId_idx" ON "transition_tracks"("spotifyId");

-- CreateIndex
CREATE INDEX "transition_tracks_position_idx" ON "transition_tracks"("position");

-- CreateIndex
CREATE INDEX "transition_points_transitionId_idx" ON "transition_points"("transitionId");

-- CreateIndex
CREATE INDEX "transition_points_trackId_idx" ON "transition_points"("trackId");

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "playlist_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "playlist_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transition_tracks" ADD CONSTRAINT "transition_tracks_transitionId_fkey" FOREIGN KEY ("transitionId") REFERENCES "transitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transition_tracks" ADD CONSTRAINT "transition_tracks_fromTrackId_fkey" FOREIGN KEY ("fromTrackId") REFERENCES "transition_tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transition_points" ADD CONSTRAINT "transition_points_transitionId_fkey" FOREIGN KEY ("transitionId") REFERENCES "transitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transition_points" ADD CONSTRAINT "transition_points_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "transition_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
