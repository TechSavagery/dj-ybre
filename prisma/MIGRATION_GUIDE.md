# Database Migration Guide

This project uses Prisma with Neon (PostgreSQL) for database management. This guide explains how to handle schema changes smoothly.

## Environment Variables

You need two database URLs in your `.env` file:

```env
# Connection pooling URL (for application queries)
# Get this from Neon dashboard → Connection Details → Connection Pooling
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"

# Direct connection URL (optional, for migrations)
# Get this from Neon dashboard → Connection Details → Direct Connection
DATABASE_URL_UNPOOLED="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

**Important:**
- `DATABASE_URL` should use Neon's **connection pooling URL** for better serverless performance
- `DATABASE_URL_UNPOOLED` is optional but recommended for migrations (uses direct connection, not pooled)
- If `DATABASE_URL_UNPOOLED` is not set, migrations will use `DATABASE_URL`

## Making Schema Changes

### 1. Update the Schema

Edit `prisma/schema.prisma` to make your changes:

```prisma
model Transition {
  id   String @id @default(cuid())
  name String
  // Add your new fields here
  newField String?
}
```

### 2. Create and Apply Migration

```bash
# Create a new migration (interactive - will prompt for name)
npm run db:migrate

# Or specify a name directly
npx prisma migrate dev --name add_new_field
```

This will:
- Create a new migration file in `prisma/migrations/`
- Apply the migration to your database
- Regenerate the Prisma Client

### 3. Verify Changes

```bash
# Open Prisma Studio to view your database
npm run db:studio
```

## Migration Workflow

### Development

1. **Make schema changes** in `prisma/schema.prisma`
2. **Create migration**: `npm run db:migrate`
3. **Test locally** to ensure everything works
4. **Commit** both schema and migration files

### Production (Vercel)

Migrations are automatically applied during build if you have:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

Or manually deploy migrations:

```bash
npm run db:migrate:deploy
```

## Quick Commands

```bash
# Generate Prisma Client (after schema changes)
npm run db:generate

# Push schema changes without creating migration (dev only)
npm run db:push

# Create and apply migration
npm run db:migrate

# Deploy migrations to production
npm run db:migrate:deploy

# Open database GUI
npm run db:studio
```

## Current Models

### Playlist Models
- `PlaylistSession` - Playlist generation sessions
- `PlaylistTrack` - Tracks in playlists
- `UserInteraction` - User interactions (hearts, removes)

### Transition Models
- `Transition` - DJ transition metadata
- `TransitionTrack` - Tracks involved in transitions
- `TransitionPoint` - Timestamps marking transition moments

## Best Practices

1. **Always create migrations** - Don't use `db:push` in production
2. **Test migrations locally** before deploying
3. **Review migration SQL** in `prisma/migrations/` before applying
4. **Use descriptive migration names** - e.g., `add_transition_points`
5. **Keep migrations small** - One logical change per migration
6. **Never edit existing migrations** - Create new ones instead

## Troubleshooting

### Migration fails

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually fix the migration SQL and reapply
npx prisma migrate resolve --applied <migration_name>
```

### Schema out of sync

```bash
# Pull current database schema
npx prisma db pull

# Compare with your schema
npx prisma migrate diff
```

### Connection issues

- Verify `DATABASE_URL` is using Neon's connection pooling URL
- Check that `DATABASE_URL_UNPOOLED` (if set) uses the direct connection URL
- Ensure SSL mode is set: `?sslmode=require`

## Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Neon Connection Pooling](https://neon.tech/docs/connect/connection-pooling)
- [Prisma + Neon Guide](https://neon.tech/docs/guides/prisma)
