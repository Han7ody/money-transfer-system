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

  // 4. Seed sample audit logs
  const auditLogsData = [
    {
      adminId: admin.id,
      action: 'ADMIN_LOGIN',
      entity: 'Auth',
      oldValue: null,
      newValue: { email: admin.email },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
    },
    {
      adminId: admin.id,
      action: 'UPDATE_EXCHANGE_RATE',
      entity: 'ExchangeRates',
      entityId: '1',
      oldValue: { fromCurrency: 'SDG', toCurrency: 'INR', rate: '0.12', adminFeePercent: '1.50' },
      newValue: { fromCurrency: 'SDG', toCurrency: 'INR', rate: '0.14', adminFeePercent: '2.00' },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
    },
    {
      adminId: admin.id,
      action: 'APPROVE_KYC',
      entity: 'User',
      entityId: '2',
      oldValue: { kycStatus: 'PENDING' },
      newValue: { kycStatus: 'APPROVED' },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    },
    {
      adminId: admin.id,
      action: 'UPDATE_GENERAL_SETTINGS',
      entity: 'SystemSettings',
      oldValue: { platformName: 'Rasid', supportEmail: 'old@rasid.com' },
      newValue: { platformName: 'Rasid', supportEmail: 'support@rasid.com' },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
    },
    {
      adminId: admin.id,
      action: 'APPROVE_TRANSACTION',
      entity: 'Transaction',
      entityId: '1',
      oldValue: { status: 'PENDING' },
      newValue: { status: 'APPROVED' },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      adminId: admin.id,
      action: 'CREATE_EXCHANGE_RATE',
      entity: 'ExchangeRates',
      entityId: '4',
      oldValue: null,
      newValue: { fromCurrency: 'EUR', toCurrency: 'SDG', rate: '1100.00', adminFeePercent: '1.50' },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
    },
    {
      adminId: admin.id,
      action: 'ADMIN_LOGOUT',
      entity: 'Auth',
      oldValue: null,
      newValue: { email: admin.email },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    }
  ];

  // Delete existing audit logs and insert new ones
  await prisma.auditLog.deleteMany({});
  await prisma.auditLog.createMany({ data: auditLogsData });
  console.log(`Inserted ${auditLogsData.length} sample audit logs.`);

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