-- AlterTable: Change transition type from String to String[]
-- This migration preserves existing data by converting single string values to arrays

-- Step 1: Add a new temporary column for the array type
ALTER TABLE "transitions" ADD COLUMN "type_new" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 2: Migrate existing data: convert single string values to arrays
-- If type is not null and not empty, convert it to an array with one element
UPDATE "transitions" 
SET "type_new" = CASE 
  WHEN "type" IS NOT NULL AND "type" != '' THEN ARRAY["type"]
  ELSE ARRAY[]::TEXT[]
END;

-- Step 3: Drop the old column
ALTER TABLE "transitions" DROP COLUMN "type";

-- Step 4: Rename the new column to the original name
ALTER TABLE "transitions" RENAME COLUMN "type_new" TO "type";

-- Step 5: Remove the default (we want it to be an empty array by default, handled by Prisma)
ALTER TABLE "transitions" ALTER COLUMN "type" DROP DEFAULT;
