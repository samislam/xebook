-- This migration was generated before `Institution` existed in the migration chain.
-- Keep it idempotent so fresh production databases can continue applying migrations.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Institution'
  ) THEN
    ALTER TABLE "Institution" ALTER COLUMN "updatedAt" DROP DEFAULT;
  END IF;
END $$;
