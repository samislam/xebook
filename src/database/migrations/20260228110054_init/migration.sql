-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "TransactionCurrency" AS ENUM ('USD', 'TRY');

-- CreateTable
CREATE TABLE "TradeTransaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "transactionValue" DECIMAL(18,4),
    "transactionCurrency" "TransactionCurrency",
    "amountReceived" DECIMAL(18,4) NOT NULL,
    "amountSold" DECIMAL(18,4),
    "pricePerUnit" DECIMAL(18,6),
    "receivedCurrency" "TransactionCurrency" NOT NULL DEFAULT 'TRY',
    "commissionPercent" DECIMAL(8,4),
    "effectiveRateTry" DECIMAL(18,6),
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeTransaction_pkey" PRIMARY KEY ("id")
);
