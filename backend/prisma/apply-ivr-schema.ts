import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Safely applying Outbound IVR & Reseller schema updates...');

  // 1. Create Enum if not exists
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "IvrOrderStatus" AS ENUM ('PENDING', 'CALLING', 'CONFIRMED', 'CANCELLATION_REQUESTED', 'CANCELLED', 'CALLBACK_SCHEDULED', 'FAILED', 'EXPIRED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // 2. Add ivrOrderId to CallRecord
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "CallRecord" ADD COLUMN IF NOT EXISTS "ivrOrderId" TEXT;
  `);

  // 3. Create IvrFlow table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "IvrFlow" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "welcomeAudioId" TEXT REFERENCES "AudioAsset"("id") ON DELETE SET NULL,
      "welcomeTtsText" TEXT,
      "confirmAudioId" TEXT REFERENCES "AudioAsset"("id") ON DELETE SET NULL,
      "confirmTtsText" TEXT DEFAULT 'আপনার অর্ডারটি সফলভাবে নিশ্চিত করা হয়েছে। ধন্যবাদ।',
      "cancelAudioId" TEXT REFERENCES "AudioAsset"("id") ON DELETE SET NULL,
      "cancelTtsText" TEXT DEFAULT 'আপনার অর্ডার বাতিলের অনুরোধ গ্রহণ করা হয়েছে। প্রতিনিধি আপনার সাথে যোগাযোগ করবেন।',
      "callbackAudioId" TEXT REFERENCES "AudioAsset"("id") ON DELETE SET NULL,
      "callbackTtsText" TEXT DEFAULT 'আপনার কলব্যাক অনুরোধ রেকর্ড করা হয়েছে। শীঘ্রই কল করা হবে।',
      "confirmKey" TEXT NOT NULL DEFAULT '1',
      "cancelKey" TEXT NOT NULL DEFAULT '2',
      "callbackKey" TEXT NOT NULL DEFAULT '3',
      "transferKey" TEXT NOT NULL DEFAULT '0',
      "transferDestination" TEXT,
      "maxRepeats" INTEGER NOT NULL DEFAULT 2,
      "timeoutSeconds" INTEGER NOT NULL DEFAULT 6,
      "fallbackAction" TEXT NOT NULL DEFAULT 'HANGUP',
      "autoCancelPolicy" BOOLEAN NOT NULL DEFAULT false,
      "isDefault" BOOLEAN NOT NULL DEFAULT false,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "IvrFlow_userId_idx" ON "IvrFlow"("userId");`);

  // 4. Create IvrOrder table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "IvrOrder" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "resellerId" TEXT,
      "orderNumber" TEXT NOT NULL,
      "customerName" TEXT,
      "customerPhone" TEXT NOT NULL,
      "orderAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      "currency" TEXT NOT NULL DEFAULT 'BDT',
      "itemsSummary" TEXT,
      "metadata" JSONB,
      "status" "IvrOrderStatus" NOT NULL DEFAULT 'PENDING',
      "dtmfPressed" TEXT,
      "flowId" TEXT REFERENCES "IvrFlow"("id") ON DELETE SET NULL,
      "attempts" INTEGER NOT NULL DEFAULT 0,
      "maxAttempts" INTEGER NOT NULL DEFAULT 3,
      "nextAttemptAt" TIMESTAMP(3),
      "lastAttemptAt" TIMESTAMP(3),
      "webhookUrl" TEXT,
      "webhookStatus" TEXT,
      "webhookAttempts" INTEGER NOT NULL DEFAULT 0,
      "webhookResponse" TEXT,
      "confirmedAt" TIMESTAMP(3),
      "cancelledAt" TIMESTAMP(3),
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "IvrOrder_userId_idx" ON "IvrOrder"("userId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "IvrOrder_customerPhone_idx" ON "IvrOrder"("customerPhone");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "IvrOrder_orderNumber_idx" ON "IvrOrder"("orderNumber");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "IvrOrder_status_idx" ON "IvrOrder"("status");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "IvrOrder_nextAttemptAt_idx" ON "IvrOrder"("nextAttemptAt");`);

  // 5. Create IvrCallback table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "IvrCallback" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "orderId" TEXT REFERENCES "IvrOrder"("id") ON DELETE CASCADE,
      "customerPhone" TEXT NOT NULL,
      "scheduledAt" TIMESTAMP(3) NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "notes" TEXT,
      "callAttempts" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "IvrCallback_userId_idx" ON "IvrCallback"("userId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "IvrCallback_scheduledAt_idx" ON "IvrCallback"("scheduledAt");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "IvrCallback_status_idx" ON "IvrCallback"("status");`);

  // 6. Create ResellerBrand table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ResellerBrand" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "resellerId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
      "customDomain" TEXT UNIQUE,
      "brandName" TEXT NOT NULL,
      "logoUrl" TEXT,
      "faviconUrl" TEXT,
      "primaryColor" TEXT NOT NULL DEFAULT '#2563eb',
      "secondaryColor" TEXT NOT NULL DEFAULT '#1e40af',
      "supportEmail" TEXT,
      "supportPhone" TEXT,
      "footerText" TEXT,
      "isVerified" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. Create AuditLog table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
      "action" TEXT NOT NULL,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT,
      "details" JSONB,
      "ipAddress" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuditLog_entityType_idx" ON "AuditLog"("entityType");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");`);

  console.log('✅ Outbound IVR & Reseller schema applied safely with zero data loss!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
