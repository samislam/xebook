-- CreateTable
CREATE TABLE "public"."PriceCalculatorScenario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceCalculatorScenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceCalculatorScenario_userId_name_key" ON "public"."PriceCalculatorScenario"("userId", "name");

-- CreateIndex
CREATE INDEX "PriceCalculatorScenario_userId_createdAt_idx" ON "public"."PriceCalculatorScenario"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."PriceCalculatorScenario" ADD CONSTRAINT "PriceCalculatorScenario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
