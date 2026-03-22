UPDATE "User"
SET "name" = "username"
WHERE "name" IS NULL;

ALTER TABLE "User"
ALTER COLUMN "name" SET NOT NULL;
