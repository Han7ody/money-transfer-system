// backend/src/seed.ts
import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create SUPER_ADMIN user
  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@moneytransfer.com';
  const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';
  const superAdminPasswordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    update: {
      passwordHash: superAdminPasswordHash,
      role: 'SUPER_ADMIN',
    },
    create: {
      fullName: 'Super Admin',
      email: SUPER_ADMIN_EMAIL,
      passwordHash: superAdminPasswordHash,
      role: 'SUPER_ADMIN',
      country: 'System',
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`Created/updated super admin user: ${superAdmin.email}`);

  // 2. Create ADMIN user
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@moneytransfer.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
    create: {
      fullName: 'System Admin',
      email: ADMIN_EMAIL,
      phone: '+249123456789',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      country: 'Sudan',
      isVerified: true,
      isActive: true,
    },
  });
  console.log(`Created/updated admin user: ${admin.email}`);

  // 3. Insert Currencies
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

  // 4. Insert default Exchange Rates
  const getCurrencyId = (code: string) => currencies.find(c => c.code === code)!.id;

  const exchangeRatesData = [
    {
      fromCurrencyId: getCurrencyId('SDG'),
      toCurrencyId: getCurrencyId('INR'),
      rate: new Prisma.Decimal('0.14'),
      adminFeePercent: new Prisma.Decimal('2.00'),
      updatedBy: superAdmin.id,
    },
    {
      fromCurrencyId: getCurrencyId('INR'),
      toCurrencyId: getCurrencyId('SDG'),
      rate: new Prisma.Decimal('7.14'),
      adminFeePercent: new Prisma.Decimal('2.00'),
      updatedBy: superAdmin.id,
    },
    {
      fromCurrencyId: getCurrencyId('USD'),
      toCurrencyId: getCurrencyId('SDG'),
      rate: new Prisma.Decimal('1000.00'),
      adminFeePercent: new Prisma.Decimal('1.00'),
      updatedBy: superAdmin.id,
    },
  ];

  const exchangeRatePromises = exchangeRatesData.map(data =>
    prisma.exchangeRate.upsert({
      where: {
        fromCurrencyId_toCurrencyId: {
          fromCurrencyId: data.fromCurrencyId,
          toCurrencyId: data.toCurrencyId
        }
      },
      update: data,
      create: data,
    })
  );

  await prisma.$transaction(exchangeRatePromises);
  console.log(`Inserted ${exchangeRatesData.length} exchange rates.`);

  // 5. Seed sample audit logs
  const auditLogsData = [
    {
      adminId: superAdmin.id,
      action: 'ADMIN_LOGIN',
      entity: 'Auth',
      newValue: { email: superAdmin.email },
      ipAddress: '127.0.0.1',
    },
    {
      adminId: admin.id,
      action: 'ADMIN_LOGIN',
      entity: 'Auth',
      newValue: { email: admin.email },
      ipAddress: '127.0.0.1',
    },
  ];

  await prisma.auditLog.deleteMany({});
  await prisma.auditLog.createMany({ data: auditLogsData });
  console.log(`Inserted ${auditLogsData.length} sample audit logs.`);

  // 6. Seed default system settings
  const defaultSettings = [
    { key: 'platformName', value: 'Rasid - نظام التحويلات المالية', category: 'general', updatedBy: superAdmin.id },
    { key: 'logoUrl', value: '', category: 'general', updatedBy: superAdmin.id },
    { key: 'timezone', value: 'Africa/Khartoum', category: 'general', updatedBy: superAdmin.id },
    { key: 'defaultLanguage', value: 'ar', category: 'general', updatedBy: superAdmin.id },
    { key: 'maintenance_mode', value: 'false', category: 'general', updatedBy: superAdmin.id },
    { key: 'defaultCurrency', value: 'SDG', category: 'general', updatedBy: superAdmin.id },
    { key: 'supportEmail', value: process.env.SUPPORT_EMAIL || 'support@rasid.com', category: 'general', updatedBy: superAdmin.id },
    { key: 'supportPhone', value: '+249 123 456 789', category: 'general', updatedBy: superAdmin.id },
    { key: 'defaultFeePercent', value: '2.5', category: 'general', updatedBy: superAdmin.id },
    { key: 'companyAddress', value: 'الخرطوم، السودان', category: 'general', updatedBy: superAdmin.id },
    { key: 'dateFormat', value: 'YYYY-MM-DD', category: 'general', updatedBy: superAdmin.id },
    { key: 'timeFormat', value: '24h', category: 'general', updatedBy: superAdmin.id },
  ];

  const settingsPromises = defaultSettings.map(data =>
    prisma.systemSettings.upsert({
      where: { key: data.key },
      update: data,
      create: data,
    })
  );

  await prisma.$transaction(settingsPromises);
  console.log(`Inserted ${defaultSettings.length} default system settings.`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });