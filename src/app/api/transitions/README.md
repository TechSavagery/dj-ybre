# DJ Transitions API

A robust API for cataloging DJ transitions with track metadata from Spotify.

## Database Schema

The transitions system uses three main models:

- **Transition**: Main entity storing transition metadata (name, type, notes, tags, etc.)
- **TransitionTrack**: Tracks involved in the transition (2-4 tracks) with full Spotify metadata
- **TransitionPoint**: Timestamps marking specific transition moments within tracks

All tables are prefixed with `transition_` to keep the database organized alongside other projects.

## API Endpoints

### GET /api/transitions

List all transitions with optional filtering.

**Query Parameters:**
- `type` - Filter by transition type (e.g., `beat_match`, `word_play`)
- `tag` - Filter by tag
- `search` - Search in name and notes
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)

**Example:**
```bash
GET /api/transitions?type=beat_match&tag=house&limit=10
```

**Response:**
```json
{
  "transitions": [...],
  "pagination": {
    "total": 42,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### POST /api/transitions

Create a new transition.

**Request Body:**
```json
{
  "tracks": [
    {
      "spotifyId": "4iV5W9uYEdYUVa79Axb7Rh",
      "position": 1
    },
    {
      "spotifyId": "3n3Ppam7vgaVa1iaRUc9Lp",
      "position": 2,
      "fromTrackId": "4iV5W9uYEdYUVa79Axb7Rh"
    }
  ],
  "type": "beat_match",
  "name": "Custom Transition Name (optional)",
  "notes": "Transition notes and tutorial",
  "stemsNotes": "Using vocals from track 1, instrumental from track 2",
  "tags": ["house", "progressive", "smooth"],
  "points": [
    {
      "spotifyId": "4iV5W9uYEdYUVa79Axb7Rh",
      "timestamp": 120.5,
      "description": "Start transition at chorus",
      "pointType": "chorus"
    },
    {
      "spotifyId": "3n3Ppam7vgaVa1iaRUc9Lp",
      "timestamp": 0,
      "description": "Enter with first verse",
      "pointType": "verse"
    }
  ]
}
```

**Notes:**
- `tracks`: Array of 2-4 tracks. Each track must have `spotifyId` and `position` (1-4)
- `fromTrackId`: For tracks at position 2+, specify which track (by spotifyId) this transitions from
- `type`: One of: `beat_match`, `word_play`, `key_change`, `drop_swap`, `mashup`, `backspin`, `echo_out`, `filter_sweep`, `loop_swap`, `phrase_match`, `other`
- `name`: Optional. If not provided, auto-generated as "Track 1 → Track 2"
- `points`: Optional array of transition points with timestamps

**Response:** Returns the created transition with all relations.

### GET /api/transitions/[id]

Get a single transition by ID.

**Response:** Returns transition with tracks, points, and all metadata.

### PUT /api/transitions/[id]

Update a transition. Same request body format as POST, but all fields are optional.

### DELETE /api/transitions/[id]

Delete a transition (cascades to tracks and points).

## Transition Types

- `beat_match` - Simple beat matching transition
- `word_play` - Using words from one song to transition to another
- `key_change` - Key change transition
- `drop_swap` - Swapping drops between tracks
- `mashup` - Mashup transition
- `backspin` - Backspin technique
- `echo_out` - Echo out effect
- `filter_sweep` - Filter sweep transition
- `loop_swap` - Loop swapping
- `phrase_match` - Phrase matching
- `other` - Other transition types

## Track Metadata

When you provide a `spotifyId`, the API automatically fetches and stores:

- Basic info: name, artist, album, duration, preview URL
- Audio features: BPM, key, mode, time signature, energy, danceability, valence
- Genres: Extracted from artist data
- Popularity and release date
- Full audio features object from Spotify API

## Authentication

All endpoints (except GET) require Spotify authentication via the `spotify_access_token` cookie.

## Example: Creating a Beat Match Transition

```javascript
const response = await fetch('/api/transitions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tracks: [
      {
        spotifyId: '4iV5W9uYEdYUVa79Axb7Rh', // Track 1
        position: 1
      },
      {
        spotifyId: '3n3Ppam7vgaVa1iaRUc9Lp', // Track 2
        position: 2,
        fromTrackId: '4iV5W9uYEdYUVa79Axb7Rh' // Transitions from Track 1
      }
    ],
    type: 'beat_match',
    notes: 'Match BPM at 128, transition during breakdown',
    tags: ['house', '128bpm'],
    points: [
      {
        spotifyId: '4iV5W9uYEdYUVa79Axb7Rh',
        timestamp: 90.0,
        description: 'Start mixing at breakdown',
        pointType: 'breakdown'
      },
      {
        spotifyId: '3n3Ppam7vgaVa1iaRUc9Lp',
        timestamp: 15.5,
        description: 'Bring in new track at build',
        pointType: 'build'
      }
    ]
  })
})
```

## Database Migration

To apply the schema changes to your database:

```bash
npx prisma migrate dev --name add_transitions
```

Or if you prefer to create the migration without applying it:

```bash
npx prisma migrate dev --create-only --name add_transitions
```










