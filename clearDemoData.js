require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DEMO_TAG = 'DEMO_DATA';

async function clear() {
  console.log('🗑️  Demo ma\'lumotlarni o\'chirish boshlandi...\n');

  // Find all demo users
  const demoUsers = await prisma.user.findMany({
    where: { additional_info: DEMO_TAG },
    select: { id: true, name: true, user_type: true },
  });

  if (demoUsers.length === 0) {
    console.log('ℹ️  Demo ma\'lumotlar topilmadi. Hech narsa o\'chirilmadi.');
    await prisma.$disconnect();
    return;
  }

  const demoUserIds = demoUsers.map((u) => u.id);

  // Step 1: Delete products for demo shops (SET NULL cascade — not auto-deleted)
  const demoShops = await prisma.shop.findMany({
    where: { user_id: { in: demoUserIds } },
    select: { id: true },
  });
  const demoShopIds = demoShops.map((s) => s.id);

  if (demoShopIds.length > 0) {
    const deletedProducts = await prisma.product.deleteMany({
      where: { shop_id: { in: demoShopIds } },
    });
    console.log(`🗑️  Mahsulotlar o'chirildi: ${deletedProducts.count}`);
  }

  // Step 2: Delete worker_submissions for demo users (no cascade)
  const deletedWS = await prisma.workerSubmission.deleteMany({
    where: { user_id: { in: demoUserIds } },
  });
  if (deletedWS.count > 0) console.log(`🗑️  Worker submissions o'chirildi: ${deletedWS.count}`);

  // Step 3: Delete shop_submissions for demo users (no cascade)
  const deletedSS = await prisma.shopSubmission.deleteMany({
    where: { user_id: { in: demoUserIds } },
  });
  if (deletedSS.count > 0) console.log(`🗑️  Shop submissions o'chirildi: ${deletedSS.count}`);

  // Step 4: Delete all demo users — cascades to:
  //   workers → portfolio, calendar, views, job_responses, ratings, bookmarks (all CASCADE)
  //   shops → already emptied above
  //   job_requests, ratings (as customer), bookmarks, notifications (all CASCADE)
  const deleted = await prisma.user.deleteMany({
    where: { additional_info: DEMO_TAG },
  });

  console.log(`\n✅ ${deleted.count} demo foydalanuvchi o'chirildi (ustalar, do'konlar, mijozlar)`);
  console.log('   Barcha bog\'liq ma\'lumotlar (portfolio, kafel, reyting va boshqalar) ham o\'chirildi.');
  console.log('\n🧹 Baza toza. Haqiqiy foydalanuvchi ma\'lumotlariga tegmadik.');

  await prisma.$disconnect();
}

clear().catch((e) => {
  console.error('❌ Xato:', e);
  prisma.$disconnect();
  process.exit(1);
});
