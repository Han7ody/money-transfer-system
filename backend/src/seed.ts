// backend/src/seed.ts
import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

// التحقق من أن Prisma Client يستخدم نفس البناء الذي تم توليده
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. إنشاء المستخدم المسؤول (ADMIN)
  // نستخدم المتغيرات من .env
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@moneytransfer.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      fullName: 'System Admin',
      email: ADMIN_EMAIL,
      phone: '+249123456789',
      passwordHash: passwordHash,
      role: 'ADMIN',
      country: 'Sudan',
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`Created/updated admin user: ${admin.email}`);

  // 2. إدراج العملات (Currencies)
  const currenciesData: Prisma.CurrencyCreateInput[] = [
    { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س', country: 'Sudan' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'India' },
    { code: 'USD', name: 'US Dollar', symbol: '$', country: 'United States' },
    { code: 'EUR', name: 'Euro', symbol: '€', country: 'European Union' },
  ];

  const currencyPromises = currenciesData.map(data => 
    prisma.currency.upsert({
      where: { code: data.code },
      update: {},
      create: data,
    })
  );

  const currencies = await prisma.$transaction(currencyPromises);
  console.log(`Inserted ${currencies.length} currencies.`);

  // 3. إدراج أسعار الصرف الافتراضية (Exchange Rates)
  const getCurrencyId = (code: string) => currencies.find(c => c.code === code)!.id;

  // 🛑 التصحيح الرئيسي: استخدام 'connect' لربط العلاقة 'updater' بدلاً من حقل ID المباشر 'updatedBy'
  const exchangeRatesData = [
    // SDG to INR
    { 
      fromCurrency: { connect: { code: 'SDG' } },
      toCurrency: { connect: { code: 'INR' } },
      rate: new Prisma.Decimal('0.14'),
      adminFeePercent: new Prisma.Decimal('2.00'),
      updater: { connect: { id: admin.id } } // 👈 تم التصحيح: استخدام 'updater' (اسم العلاقة) و 'connect'
    },
    // INR to SDG
    { 
      fromCurrency: { connect: { code: 'INR' } },
      toCurrency: { connect: { code: 'SDG' } },
      rate: new Prisma.Decimal('7.14'),
      adminFeePercent: new Prisma.Decimal('2.00'),
      updater: { connect: { id: admin.id } } // 👈 تم التصحيح
    },
    // USD to SDG
    { 
      fromCurrency: { connect: { code: 'USD' } },
      toCurrency: { connect: { code: 'SDG' } },
      rate: new Prisma.Decimal('1000.00'), 
      adminFeePercent: new Prisma.Decimal('1.00'),
      updater: { connect: { id: admin.id } } // 👈 تم التصحيح
    },
  ];

  const exchangeRatePromises = exchangeRatesData.map(data => 
    prisma.exchangeRate.upsert({
      where: {
        // نستخدم ID للـ 'where' لضمان التفرد
        fromCurrencyId_toCurrencyId: { 
          fromCurrencyId: getCurrencyId(data.fromCurrency.connect.code),
          toCurrencyId: getCurrencyId(data.toCurrency.connect.code)
        }
      },
      // في أقسام update و create نستخدم كائنات العلاقات (connect)
      update: data as any, 
      create: data as any,
    })
  );

  await prisma.$transaction(exchangeRatePromises);
  console.log(`Inserted ${exchangeRatesData.length} exchange rates.`);

  console.log('Seeding finished.');
}

// execute the main function
main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });