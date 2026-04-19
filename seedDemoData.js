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
    ratings: [{ stars: 5, review: "Juda zo'r elektrik, ishni tez va sifatli bajardi!" }],
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
    calendar: [{ date: '2026-04-22', status: 'busy' }],
    ratings: [{ stars: 5, review: "Santexnik bo'yicha eng yaxshisi! Muammoni darhol hal qildi." }],
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
    ratings: [{ stars: 5, review: "Ajoyib duradgor! Mebel juda chiroyli chiqdi." }],
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
    ratings: [{ stars: 5, review: "Devorlar superdek tekis! Rahmat Ulugbek aka." }],
  },
  {
    phone: '+998000000005',
    name: 'Firdavs Abdullayev',
    profession: 'Bo\'yoqchi',
    region: 'Farg\'ona',
    city: 'Farg\'ona',
    experience: '4 yil',
    description: "Xona va uylarni bo'yash, devorga dekor ishlar.",
    rating: 4.3,
    is_verified: true,
    is_featured: false,
    featured_order: 0,
    portfolio: [
      'https://picsum.photos/seed/paint1/600/400',
      'https://picsum.photos/seed/paint2/600/400',
    ],
    calendar: [{ date: '2026-04-24', status: 'busy' }],
    ratings: [{ stars: 4, review: "Bo'yoq ishlari zo'r chiqdi, rahmat!" }],
  },
  {
    phone: '+998000000006',
    name: 'Ravshan Xolmatov',
    profession: 'Kafelchi',
    region: 'Buxoro',
    city: 'Buxoro',
    experience: '9 yil',
    description: "Hammom, oshxona va polga kafel yotqizish. 9 yillik tajriba.",
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
    ratings: [{ stars: 5, review: "Kafelni juda chiroyli yotqizdi, hamma hayron qoldi!" }],
  },
  {
    phone: '+998000000007',
    name: 'Dilshod Raxmatullayev',
    profession: 'Toqchi',
    region: 'Namangan',
    city: 'Namangan',
    experience: '7 yil',
    description: "Tom qoplash, profil list o'rnatish, yomg'irdan himoya.",
    rating: 4.4,
    is_verified: false,
    is_featured: false,
    featured_order: 0,
    portfolio: ['https://picsum.photos/seed/roof1/600/400'],
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
    description: "Darvoza, to'siq, zinapoya, temir konstruksiyalar. Individual buyurtmalar.",
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
    description: "Konditsioner o'rnatish, texnik xizmat, ta'mirlash.",
    rating: 4.2,
    is_verified: false,
    is_featured: false,
    featured_order: 0,
    portfolio: ['https://picsum.photos/seed/ac1/600/400'],
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
    ratings: [{ stars: 5, review: "15 yillik tajriba seziladi. Ish sifati yuqori darajada!" }],
  },
];

// Realistic Uzbek construction market prices (2026)
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
      {
        product_name: "Sement M400 (50 kg)",
        price: "78000",
        product_type: "Sement",
        description: "Yuqori sifatli M400 sement, qurilish va ta'mirlash uchun.",
        images: [
          'https://picsum.photos/seed/cement-bag1/600/400',
          'https://picsum.photos/seed/cement-bag2/600/400',
        ],
      },
      {
        product_name: "G'isht qizil (dona)",
        price: "2000",
        product_type: "G'isht",
        description: "Qizil g'isht, standart o'lcham 250x120x65 mm, pishirilgan.",
        images: [
          'https://picsum.photos/seed/red-brick1/600/400',
          'https://picsum.photos/seed/red-brick2/600/400',
          'https://picsum.photos/seed/red-brick3/600/400',
        ],
      },
      {
        product_name: "Qum quruq (1 tonna)",
        price: "720000",
        product_type: "Qum",
        description: "Toza daryo qumi, qurilish ishlariga mos, elangan.",
        images: ['https://picsum.photos/seed/sand-pile1/600/400'],
      },
      {
        product_name: "Armatür A400 12mm (1 metr)",
        price: "17500",
        product_type: "Temir",
        description: "A400 markali armatür, poydevor va beton uchun.",
        images: [
          'https://picsum.photos/seed/rebar1/600/400',
          'https://picsum.photos/seed/rebar2/600/400',
        ],
      },
      {
        product_name: "Shag'al 20mm (1 tonna)",
        price: "520000",
        product_type: "Shag'al",
        description: "Beton aralashmasiga mos 20mm shag'al.",
        images: ['https://picsum.photos/seed/gravel1/600/400'],
      },
      {
        product_name: "Sement M500 (50 kg)",
        price: "98000",
        product_type: "Sement",
        description: "Mustahkam M500 sement, yuqori yuklamali konstruksiyalar uchun.",
        images: [
          'https://picsum.photos/seed/cement-m500-1/600/400',
          'https://picsum.photos/seed/cement-m500-2/600/400',
        ],
      },
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
      {
        product_name: "Pol kafel 60x60 (kv.m)",
        price: "165000",
        product_type: "Plitka",
        description: "Polsha ishlab chiqaruvchisi, pol uchun, yiltiraydi.",
        images: [
          'https://picsum.photos/seed/floor-tile1/600/400',
          'https://picsum.photos/seed/floor-tile2/600/400',
          'https://picsum.photos/seed/floor-tile3/600/400',
        ],
      },
      {
        product_name: "Devor kafel 30x60 (kv.m)",
        price: "115000",
        product_type: "Plitka",
        description: "Hammom va oshxona devorlariga mos oq kafel.",
        images: [
          'https://picsum.photos/seed/wall-tile1/600/400',
          'https://picsum.photos/seed/wall-tile2/600/400',
        ],
      },
      {
        product_name: "Gresit plitka 80x80 (kv.m)",
        price: "265000",
        product_type: "Plitka",
        description: "Premium gresit, suv o'tkazmaydi, chidamli, yorqin.",
        images: [
          'https://picsum.photos/seed/gresit1/600/400',
          'https://picsum.photos/seed/gresit2/600/400',
          'https://picsum.photos/seed/gresit3/600/400',
        ],
      },
      {
        product_name: "Shisha mozaika panel 30x30",
        price: "195000",
        product_type: "Plitka",
        description: "Hammom va basseyn uchun shisha mozaika.",
        images: [
          'https://picsum.photos/seed/mosaic1/600/400',
          'https://picsum.photos/seed/mosaic2/600/400',
        ],
      },
      {
        product_name: "Kafel yelimi (25 kg)",
        price: "68000",
        product_type: "Boshqa",
        description: "Professional kafel yelimi, tez qotadi, suv o'tkazmaydi.",
        images: ['https://picsum.photos/seed/tile-glue1/600/400'],
      },
      {
        product_name: "Kafel fuga (2 kg)",
        price: "38000",
        product_type: "Boshqa",
        description: "Kafel chok to'ldiruvchi fuga, 20 ta rang mavjud.",
        images: ['https://picsum.photos/seed/grout1/600/400'],
      },
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
      {
        product_name: "PPR plastik quvur 20mm (metr)",
        price: "15000",
        product_type: "Boshqa",
        description: "PPR plastik quvur, issiq va sovuq suv uchun, 20 yil kafolat.",
        images: [
          'https://picsum.photos/seed/pipe1/600/400',
          'https://picsum.photos/seed/pipe2/600/400',
        ],
      },
      {
        product_name: "Bronza aralashtirgich kran",
        price: "480000",
        product_type: "Boshqa",
        description: "Yevropa sifatli bronza kran, vannaxona uchun.",
        images: [
          'https://picsum.photos/seed/faucet1/600/400',
          'https://picsum.photos/seed/faucet2/600/400',
          'https://picsum.photos/seed/faucet3/600/400',
        ],
      },
      {
        product_name: "Akril vanna 170x70",
        price: "2850000",
        product_type: "Boshqa",
        description: "Oq akril vanna, standart o'lcham, chidamli qoplama.",
        images: [
          'https://picsum.photos/seed/bathtub1/600/400',
          'https://picsum.photos/seed/bathtub2/600/400',
        ],
      },
      {
        product_name: "Unitaz + bachok to'plami",
        price: "1150000",
        product_type: "Boshqa",
        description: "Kompakt unitaz, suv tejovchi sistema, oson o'rnatiladi.",
        images: [
          'https://picsum.photos/seed/toilet1/600/400',
          'https://picsum.photos/seed/toilet2/600/400',
        ],
      },
      {
        product_name: "Dush kabinasi 90x90",
        price: "5200000",
        product_type: "Boshqa",
        description: "To'liq dush kabinasi, shisha va profil bilan, kafolat 2 yil.",
        images: [
          'https://picsum.photos/seed/shower1/600/400',
          'https://picsum.photos/seed/shower2/600/400',
          'https://picsum.photos/seed/shower3/600/400',
        ],
      },
      {
        product_name: "Metall-plastik quvur 16mm (metr)",
        price: "22000",
        product_type: "Boshqa",
        description: "Ichki quvur tarmog'i uchun metall-plastik quvur.",
        images: ['https://picsum.photos/seed/mplastic-pipe1/600/400'],
      },
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
      {
        product_name: "VVG kabel 3x2.5 (metr)",
        price: "16500",
        product_type: "Boshqa",
        description: "Mis o'tkazgichli VVG kabel, ichki elektr tarmog'i uchun.",
        images: [
          'https://picsum.photos/seed/cable1/600/400',
          'https://picsum.photos/seed/cable2/600/400',
        ],
      },
      {
        product_name: "Rozetka + kallit to'plami",
        price: "62000",
        product_type: "Boshqa",
        description: "Ikkita rozetka va bitta kallit to'plami, Yevropa standarti.",
        images: [
          'https://picsum.photos/seed/socket1/600/400',
          'https://picsum.photos/seed/socket2/600/400',
        ],
      },
      {
        product_name: "Avtomat 25A (ABB)",
        price: "135000",
        product_type: "Boshqa",
        description: "Original ABB avtomati, ishonchli himoya, 10 yil kafolat.",
        images: [
          'https://picsum.photos/seed/breaker1/600/400',
          'https://picsum.photos/seed/breaker2/600/400',
          'https://picsum.photos/seed/breaker3/600/400',
        ],
      },
      {
        product_name: "LED lenta 5050 (5 metr)",
        price: "165000",
        product_type: "Boshqa",
        description: "12V LED lenta, 5050 chip, 60 diod/metr, yorqin va tejamkor.",
        images: [
          'https://picsum.photos/seed/led-strip1/600/400',
          'https://picsum.photos/seed/led-strip2/600/400',
        ],
      },
      {
        product_name: "Elektr shield (9 o'rin)",
        price: "98000",
        product_type: "Boshqa",
        description: "Avtomatlar uchun plastik shield, 9 o'rin, IP40.",
        images: ['https://picsum.photos/seed/shield1/600/400'],
      },
      {
        product_name: "Kabel kanal 20x10 (2 metr)",
        price: "28000",
        product_type: "Boshqa",
        description: "Plastik kabel kanal, devorga mahkamlanadigan, oq rang.",
        images: ['https://picsum.photos/seed/cableduct1/600/400'],
      },
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
      {
        product_name: "Laminat 8mm AC4 (kv.m)",
        price: "145000",
        product_type: "Yog'och",
        description: "Germaniya laminati, suv bardosh, AC4 darajasi, kafolat 15 yil.",
        images: [
          'https://picsum.photos/seed/laminate1/600/400',
          'https://picsum.photos/seed/laminate2/600/400',
          'https://picsum.photos/seed/laminate3/600/400',
        ],
      },
      {
        product_name: "Eman parket (kv.m)",
        price: "385000",
        product_type: "Yog'och",
        description: "Eman parket, 18mm qalinlik, yaltiroq lakli, premium sifat.",
        images: [
          'https://picsum.photos/seed/parquet1/600/400',
          'https://picsum.photos/seed/parquet2/600/400',
        ],
      },
      {
        product_name: "MDF 16mm (1.22x2.44m)",
        price: "560000",
        product_type: "Yog'och",
        description: "Mebel va dekor uchun sifatli MDF plita.",
        images: [
          'https://picsum.photos/seed/mdf1/600/400',
          'https://picsum.photos/seed/mdf2/600/400',
        ],
      },
      {
        product_name: "Plastik plintus (2.5m)",
        price: "32000",
        product_type: "Boshqa",
        description: "Laminat uchun plastik plintus, 20 ta rang mavjud.",
        images: ['https://picsum.photos/seed/baseboard1/600/400'],
      },
      {
        product_name: "Tovush izolyatsiya substrat 3mm (kv.m)",
        price: "25000",
        product_type: "Boshqa",
        description: "Laminat ostiga yotqiziladigan substrat, tovushni kamaytiradi.",
        images: ['https://picsum.photos/seed/underlay1/600/400'],
      },
      {
        product_name: "Quruq yog'och taxta 50x100mm (metr)",
        price: "48000",
        product_type: "Yog'och",
        description: "Quritilgan yog'och taxta, qurilish va mebel uchun.",
        images: [
          'https://picsum.photos/seed/lumber1/600/400',
          'https://picsum.photos/seed/lumber2/600/400',
        ],
      },
    ],
  },
];

async function seed() {
  console.log('🌱 Demo ma\'lumotlarini kiritish boshlandi...\n');

  const existing = await prisma.user.findFirst({ where: { additional_info: DEMO_TAG } });
  if (existing) {
    console.log('⚠️  Demo ma\'lumotlar allaqachon mavjud. Avval clearDemoData.js ni ishga tushiring.');
    await prisma.$disconnect();
    return;
  }

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

    for (const img of w.portfolio) {
      await prisma.workerPortfolio.create({ data: { worker_id: worker.id, image_url: img } });
    }
    for (const cal of w.calendar) {
      await prisma.workerAvailabilityCalendar.create({ data: { worker_id: worker.id, date: cal.date, status: cal.status } });
    }
    for (const r of w.ratings) {
      try {
        await prisma.rating.create({ data: { worker_id: worker.id, customer_id: reviewer.id, stars: r.stars, review: r.review } });
        break;
      } catch (e) {}
    }

    console.log(`✅ Usta yaratildi: ${w.name} (${w.profession})`);
  }

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
      const product = await prisma.product.create({
        data: {
          shop_id: shop.id,
          product_name: p.product_name,
          price: p.price,
          description: p.description,
          product_type: p.product_type,
          seller_phone: s.phone,
        },
      });

      for (let i = 0; i < p.images.length; i++) {
        await prisma.productImage.create({ data: { product_id: product.id, image_url: p.images[i], sort_order: i } });
      }
    }

    console.log(`🏪 Do'kon yaratildi: ${s.shop_name} (${s.products.length} mahsulot)`);
  }

  const productCount = shops.reduce((sum, s) => sum + s.products.length, 0);
  console.log(`\n🎉 Demo ma'lumotlar muvaffaqiyatli kiritildi!`);
  console.log(`   👷 Ustalar: ${workers.length}`);
  console.log(`   🏪 Do'konlar: ${shops.length}`);
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
