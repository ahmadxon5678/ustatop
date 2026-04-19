require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const DEMO_TAG = 'DEMO_DATA';
const DEMO_PASSWORD = bcrypt.hashSync('Demo1234', 10);

const workers = [
  {
    phone: '+998000000001',
    name: 'Jasur Toshmatov',
    profession: 'Elektrik',
    region: 'Toshkent',
    city: 'Toshkent',
    experience: '8 yil',
    description: 'Uy va ofis elektr ishlari, 8 yillik tajriba. Sifatli va tez ishlayman.',
    rating: 4.8,
    is_verified: true,
    is_featured: true,
    featured_order: 1,
    portfolio: [
      'https://picsum.photos/seed/elec1/600/400',
      'https://picsum.photos/seed/elec2/600/400',
      'https://picsum.photos/seed/elec3/600/400',
    ],
    calendar: [
      { date: '2026-04-20', status: 'busy' },
      { date: '2026-04-21', status: 'busy' },
    ],
    ratings: [
      { stars: 5, review: "Juda zo'r elektrik, ishni tez va sifatli bajardi!" },
      { stars: 5, review: 'Narx yaxshi, vaqtida keldi. Tavsiya qilaman.' },
    ],
  },
  {
    phone: '+998000000002',
    name: 'Bobur Karimov',
    profession: 'Santexnik',
    region: 'Toshkent',
    city: 'Toshkent',
    experience: '5 yil',
    description: "Quvur almashtirish, vannaxona ta'mirlash, suv o'tkazish. Kafolat beriladi.",
    rating: 4.6,
    is_verified: true,
    is_featured: true,
    featured_order: 2,
    portfolio: [
      'https://picsum.photos/seed/plumb1/600/400',
      'https://picsum.photos/seed/plumb2/600/400',
    ],
    calendar: [
      { date: '2026-04-22', status: 'busy' },
    ],
    ratings: [
      { stars: 5, review: "Santexnik bo'yicha eng yaxshisi! Muammoni darhol hal qildi." },
      { stars: 4, review: 'Yaxshi usta, narxlari ham qulayroq.' },
    ],
  },
  {
    phone: '+998000000003',
    name: 'Sherzod Yusupov',
    profession: 'Duradgor',
    region: 'Samarqand',
    city: 'Samarqand',
    experience: '12 yil',
    description: "Mebel yasash, eshik-derazalar o'rnatish. 12 yillik tajriba.",
    rating: 4.9,
    is_verified: true,
    is_featured: true,
    featured_order: 3,
    portfolio: [
      'https://picsum.photos/seed/carp1/600/400',
      'https://picsum.photos/seed/carp2/600/400',
      'https://picsum.photos/seed/carp3/600/400',
      'https://picsum.photos/seed/carp4/600/400',
    ],
    calendar: [
      { date: '2026-04-20', status: 'busy' },
      { date: '2026-04-21', status: 'busy' },
      { date: '2026-04-23', status: 'busy' },
    ],
    ratings: [
      { stars: 5, review: "Ajoyib duradgor! Mebel juda chiroyli chiqdi." },
    ],
  },
  {
    phone: '+998000000004',
    name: 'Ulugbek Nazarov',
    profession: 'Gipschi',
    region: 'Andijon',
    city: 'Andijon',
    experience: '6 yil',
    description: "Gips, shtukaturka, devor tekislash. Yuqori sifat kafolati bilan.",
    rating: 4.5,
    is_verified: true,
    is_featured: false,
    featured_order: 0,
    portfolio: [
      'https://picsum.photos/seed/plast1/600/400',
      'https://picsum.photos/seed/plast2/600/400',
    ],
    calendar: [],
    ratings: [
      { stars: 5, review: "Devorlar superdek tekis! Rahmat Ulugbek aka." },
      { stars: 4, review: 'Yaxshi ishdi, vaqtida tugatdi.' },
    ],
  },
  {
    phone: '+998000000005',
    name: 'Firdavs Abdullayev',
    profession: 'Bo\'yoqchi',
    region: 'Farg\'ona',
    city: 'Farg\'ona',
    experience: '4 yil',
    description: "Xona va uylarni bo'yash, devorga dekor ishlar. Sifatli bo'yoqlar ishlatiladi.",
    rating: 4.3,
    is_verified: true,
    is_featured: false,
    featured_order: 0,
    portfolio: [
      'https://picsum.photos/seed/paint1/600/400',
      'https://picsum.photos/seed/paint2/600/400',
    ],
    calendar: [
      { date: '2026-04-24', status: 'busy' },
    ],
    ratings: [
      { stars: 4, review: "Bo'yoq ishlari zo'r chiqdi, rahmat!" },
    ],
  },
  {
    phone: '+998000000006',
    name: 'Ravshan Xolmatov',
    profession: 'Kafelchi',
    region: 'Buxoro',
    city: 'Buxoro',
    experience: '9 yil',
    description: "Hammom, oshxona va polga kafel yotqizish. 9 yillik tajriba bor.",
    rating: 4.7,
    is_verified: true,
    is_featured: false,
    featured_order: 0,
    portfolio: [
      'https://picsum.photos/seed/tile1/600/400',
      'https://picsum.photos/seed/tile2/600/400',
      'https://picsum.photos/seed/tile3/600/400',
    ],
    calendar: [],
    ratings: [
      { stars: 5, review: "Kafelni juda chiroyli yotqizdi, hamma hayron qoldi!" },
      { stars: 5, review: 'Eng yaxshi kafelchi! Tavsiya qilaman.' },
    ],
  },
  {
    phone: '+998000000007',
    name: 'Dilshod Raxmatullayev',
    profession: 'Toqchi',
    region: 'Namangan',
    city: 'Namangan',
    experience: '7 yil',
    description: "Tom qoplash, profil list o'rnatish, yomg'irdan himoya. Kafolat bilan.",
    rating: 4.4,
    is_verified: false,
    is_featured: false,
    featured_order: 0,
    portfolio: [
      'https://picsum.photos/seed/roof1/600/400',
    ],
    calendar: [],
    ratings: [],
  },
  {
    phone: '+998000000008',
    name: 'Otabek Mirzayev',
    profession: 'Temirchi',
    region: 'Toshkent',
    city: 'Chirchiq',
    experience: '10 yil',
    description: "Darvoza, to'siq, zinapoya, temir konstruksiyalar. Individual buyurtmalar qabul qilinadi.",
    rating: 4.6,
    is_verified: false,
    is_featured: false,
    featured_order: 0,
    portfolio: [
      'https://picsum.photos/seed/iron1/600/400',
      'https://picsum.photos/seed/iron2/600/400',
    ],
    calendar: [
      { date: '2026-04-25', status: 'busy' },
      { date: '2026-04-26', status: 'busy' },
    ],
    ratings: [],
  },
  {
    phone: '+998000000009',
    name: 'Sarvar Qodirov',
    profession: 'Konditsioner o\'rnatuvchi',
    region: 'Toshkent',
    city: 'Toshkent',
    experience: '3 yil',
    description: "Konditsioner o'rnatish, texnik xizmat, ta'mirlash. Tez va sifatli.",
    rating: 4.2,
    is_verified: false,
    is_featured: false,
    featured_order: 0,
    portfolio: [
      'https://picsum.photos/seed/ac1/600/400',
    ],
    calendar: [],
    ratings: [],
  },
  {
    phone: '+998000000010',
    name: 'Mansur Ergashev',
    profession: 'Quruvchi',
    region: 'Qashqadaryo',
    city: 'Qarshi',
    experience: '15 yil',
    description: "Uy qurilishi, poydevor, g'isht terish. 15 yillik professional tajriba.",
    rating: 4.8,
    is_verified: true,
    is_featured: false,
    featured_order: 0,
    portfolio: [
      'https://picsum.photos/seed/build1/600/400',
      'https://picsum.photos/seed/build2/600/400',
      'https://picsum.photos/seed/build3/600/400',
    ],
    calendar: [
      { date: '2026-04-20', status: 'busy' },
      { date: '2026-04-21', status: 'busy' },
      { date: '2026-04-22', status: 'busy' },
      { date: '2026-04-23', status: 'busy' },
    ],
    ratings: [
      { stars: 5, review: "15 yillik tajriba seziladi. Ish sifati yuqori darajada!" },
    ],
  },
];

const shops = [
  {
    phone: '+998000000011',
    shop_name: 'Qurilish Dunyosi',
    owner_name: 'Akbar Xasanov',
    region: 'Toshkent',
    city: 'Toshkent',
    description: "Barcha turdagi qurilish materiallari. Ulgurji va chakana savdo.",
    product_types: "Sement, qum, g'isht, armatür",
    products: [
      { product_name: "Sement M400 (50 kg)", price: "45 000 so'm", product_type: "Sement", description: "Yuqori sifatli M400 sement, qurilish va ta'mirlash uchun." },
      { product_name: "G'isht qizil (dona)", price: "1 200 so'm", product_type: "G'isht", description: "Qizil g'isht, standart o'lcham 250x120x65 mm." },
      { product_name: "Qum (1 tonna)", price: "350 000 so'm", product_type: "Qum", description: "Toza daryo qumi, qurilish ishlariga mos." },
      { product_name: "Armatür 12mm (1 metr)", price: "12 000 so'm", product_type: "Armatür", description: "A400 markali armatür, poydevor va beton uchun." },
      { product_name: "Shag'al (1 tonna)", price: "280 000 so'm", product_type: "Shag'al", description: "Beton aralashmasiga mos shag'al." },
      { product_name: "Sement M500 (50 kg)", price: "55 000 so'm", product_type: "Sement", description: "Mustahkam M500 sement, yuqori yuklamali konstruksiyalar uchun." },
    ],
  },
  {
    phone: '+998000000012',
    shop_name: 'Euro Kafel Markazi',
    owner_name: 'Nozimjon Tursunov',
    region: 'Toshkent',
    city: 'Toshkent',
    description: "Italiya, Ispaniya va mahalliy kafel kolleksiyalari. 500+ model.",
    product_types: "Kafel, mozaika, granit plitka",
    products: [
      { product_name: "Polsha kafel 60x60 (kv.m)", price: "85 000 so'm", product_type: "Kafel", description: "Polsha ishlab chiqaruvchisi, pol uchun, yiltiraydi." },
      { product_name: "Devor kafel 30x60 (kv.m)", price: "65 000 so'm", product_type: "Kafel", description: "Hammom va oshxona devorlariga mos oq kafel." },
      { product_name: "Gresit plitka 80x80 (kv.m)", price: "120 000 so'm", product_type: "Gresit", description: "Premium gresit, suv o'tkazmaydi, chidamli." },
      { product_name: "Mozaika panel (30x30)", price: "95 000 so'm", product_type: "Mozaika", description: "Hammom va basseyn uchun shisha mozaika." },
      { product_name: "Kafel yelimi (25 kg)", price: "38 000 so'm", product_type: "Yopishtirgich", description: "Professional kafel yelimi, tez qotadi." },
      { product_name: "Fuga (2 kg)", price: "22 000 so'm", product_type: "Fuga", description: "Kafel chok to'ldiruvchi fuga, 20 ta rang." },
    ],
  },
  {
    phone: '+998000000013',
    shop_name: 'Santexnika Bozori',
    owner_name: 'Hamid Tojiboyev',
    region: 'Samarqand',
    city: 'Samarqand',
    description: "Santexnika jihozlari, vannaxona uskunalari, quvurlar.",
    product_types: "Quvur, kran, vanna, unitaz",
    products: [
      { product_name: "Plastik quvur 20mm (metr)", price: "8 500 so'm", product_type: "Quvur", description: "PPR plastik quvur, issiq va sovuq suv uchun." },
      { product_name: "Aralashtirgich kran (bronza)", price: "185 000 so'm", product_type: "Armatura", description: "Yevropа sifatli bronza kran, umrbod kafolat." },
      { product_name: "Akril vanna 170x70", price: "1 250 000 so'm", product_type: "Vanna", description: "Oq akril vanna, standart o'lcham, chidamli qoplama." },
      { product_name: "Unitaz + bachok to'plami", price: "650 000 so'm", product_type: "Unitaz", description: "Kompakt unitaz, suv tejovchi, oson o'rnatiladi." },
      { product_name: "Dush kabinasi 90x90", price: "2 800 000 so'm", product_type: "Dush", description: "To'liq dush kabinasi, shisha va profil bilan." },
      { product_name: "Metall-plastik quvur 16mm (metr)", price: "12 000 so'm", product_type: "Quvur", description: "Ichki quvur tarmog'i uchun metall-plastik quvur." },
    ],
  },
  {
    phone: '+998000000014',
    shop_name: 'Elektro Savdo',
    owner_name: 'Bahodir Alimov',
    region: 'Andijon',
    city: 'Andijon',
    description: "Elektr materiallari, kabel, rozetkalar, elektr asboblari.",
    product_types: "Kabel, rozetka, avtomat, LED",
    products: [
      { product_name: "VVG kabel 3x2.5 (metr)", price: "9 500 so'm", product_type: "Kabel", description: "Mis o'tkazgichli VVG kabel, ichki elektr tarmog'i uchun." },
      { product_name: "Rozetka+vyklyuchatel' to'plami", price: "35 000 so'm", product_type: "Elektr armatüra", description: "Ikkita rozetka va bitta kallit to'plami, Yevropa standarti." },
      { product_name: "Avtomat 25A (ABB)", price: "65 000 so'm", product_type: "Avtomat", description: "Original ABB avtomati, ishonchli himoya." },
      { product_name: "LED lenta (5 metr)", price: "85 000 so'm", product_type: "Yoritish", description: "12V LED lenta, 5050 chip, 60 diod/metr." },
      { product_name: "Zaryadka paneli (10W)", price: "120 000 so'm", product_type: "Quvvat", description: "Quyosh energiyali zaryadka paneli, portativ." },
      { product_name: "Elektr shield bo'sh (9 oy'a)", price: "48 000 so'm", product_type: "Quti", description: "Avtomatlar uchun plastik shield, 9 o'rin." },
    ],
  },
  {
    phone: '+998000000015',
    shop_name: 'Daraxt va Laminat Do\'koni',
    owner_name: 'Zafar Yunusov',
    region: 'Farg\'ona',
    city: 'Farg\'ona',
    description: "Parket, laminat, MDF, taxta va yog'och materiallari.",
    product_types: "Laminat, parket, MDF, taxta",
    products: [
      { product_name: "Laminat 8mm AC4 (kv.m)", price: "75 000 so'm", product_type: "Laminat", description: "Germaniya laminati, suv bardosh, AC4 darajasi." },
      { product_name: "Parket taxtasi (kv.m)", price: "185 000 so'm", product_type: "Parket", description: "Eman parket, 18mm qalinlik, yaltiroq lakli." },
      { product_name: "MDF 16mm (1.22x2.44m)", price: "310 000 so'm", product_type: "MDF", description: "Mebel va dekor uchun sifatli MDF plita." },
      { product_name: "Plintus plastik (2.5m)", price: "18 000 so'm", product_type: "Plintus", description: "Laminat uchun plastik plintus, 20 ta rang." },
      { product_name: "Substrat 3mm (kv.m)", price: "12 000 so'm", product_type: "Substrat", description: "Laminat ostiga yotqiziladigan tovush izolyatsiya substrat." },
      { product_name: "Yog'och taxtasi (1m)", price: "22 000 so'm", product_type: "Taxta", description: "Quritilgan yog'och taxta, 50x100mm." },
    ],
  },
];

async function seed() {
  console.log('🌱 Demo ma\'lumotlarini kiritish boshlandi...\n');

  // Check for existing demo data
  const existing = await prisma.user.findFirst({ where: { additional_info: DEMO_TAG } });
  if (existing) {
    console.log('⚠️  Demo ma\'lumotlar allaqachon mavjud. Avval clearDemoData.js ni ishga tushiring.');
    await prisma.$disconnect();
    return;
  }

  // Create a single demo reviewer (customer) to attach ratings to
  const reviewer = await prisma.user.create({
    data: {
      name: 'Demo Mijoz',
      phone: '+998000000099',
      password: DEMO_PASSWORD,
      user_type: 'customer',
      region: 'Toshkent',
      city: 'Toshkent',
      additional_info: DEMO_TAG,
      status: 'active',
    },
  });

  // Create workers
  for (const w of workers) {
    const user = await prisma.user.create({
      data: {
        name: w.name,
        phone: w.phone,
        password: DEMO_PASSWORD,
        user_type: 'worker',
        region: w.region,
        city: w.city,
        additional_info: DEMO_TAG,
        status: 'active',
      },
    });

    const worker = await prisma.worker.create({
      data: {
        user_id: user.id,
        name: w.name,
        profession: w.profession,
        experience: w.experience,
        description: w.description,
        region: w.region,
        city: w.city,
        phone: w.phone,
        rating: w.rating,
        availability_status: 'available',
        approved: true,
        is_verified: w.is_verified,
        is_featured: w.is_featured,
        featured_order: w.featured_order,
        verified_at: w.is_verified ? new Date() : null,
      },
    });

    // Portfolio images
    for (const img of w.portfolio) {
      await prisma.workerPortfolio.create({
        data: { worker_id: worker.id, image_url: img },
      });
    }

    // Calendar entries
    for (const cal of w.calendar) {
      await prisma.workerAvailabilityCalendar.create({
        data: { worker_id: worker.id, date: cal.date, status: cal.status },
      });
    }

    // Ratings (use reviewer, skip if no ratings)
    for (const r of w.ratings) {
      try {
        await prisma.rating.create({
          data: {
            worker_id: worker.id,
            customer_id: reviewer.id,
            stars: r.stars,
            review: r.review,
          },
        });
        // Only one rating per unique (worker_id, customer_id) pair allowed — break after first
        break;
      } catch (e) {
        // unique constraint: skip
      }
    }

    console.log(`✅ Usta yaratildi: ${w.name} (${w.profession})`);
  }

  // Create shops + products
  for (const s of shops) {
    const user = await prisma.user.create({
      data: {
        name: s.owner_name,
        phone: s.phone,
        password: DEMO_PASSWORD,
        user_type: 'shop',
        region: s.region,
        city: s.city,
        additional_info: DEMO_TAG,
        status: 'active',
      },
    });

    const shop = await prisma.shop.create({
      data: {
        user_id: user.id,
        shop_name: s.shop_name,
        owner_name: s.owner_name,
        phone: s.phone,
        region: s.region,
        city: s.city,
        description: s.description,
        product_types: s.product_types,
        approved: true,
      },
    });

    for (const p of s.products) {
      await prisma.product.create({
        data: {
          shop_id: shop.id,
          product_name: p.product_name,
          price: p.price,
          description: p.description,
          product_type: p.product_type,
          seller_phone: s.phone,
        },
      });
    }

    console.log(`🏪 Do'kon yaratildi: ${s.shop_name} (${s.products.length} mahsulot)`);
  }

  const workerCount = workers.length;
  const shopCount = shops.length;
  const productCount = shops.reduce((sum, s) => sum + s.products.length, 0);

  console.log(`\n🎉 Demo ma'lumotlar muvaffaqiyatli kiritildi!`);
  console.log(`   👷 Ustalar: ${workerCount}`);
  console.log(`   🏪 Do'konlar: ${shopCount}`);
  console.log(`   📦 Mahsulotlar: ${productCount}`);
  console.log(`   🔑 Demo parol: Demo1234`);
  console.log(`\n   O'chirish uchun: npm run db:clear-demo`);

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('❌ Xato:', e);
  prisma.$disconnect();
  process.exit(1);
});
