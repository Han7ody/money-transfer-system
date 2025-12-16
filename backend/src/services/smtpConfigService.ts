import prisma from '../lib/prisma';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

// Simple encryption for SMTP password
export const encryptPassword = (password: string): string => {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    return password; // Fallback to plain text if encryption fails
  }
};

export const decryptPassword = (encryptedPassword: string): string => {
  try {
    const parts = encryptedPassword.split(':');
    if (parts.length !== 2) return encryptedPassword;
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return encryptedPassword; // Fallback to returning as-is
  }
};

export const getActiveSmtpConfig = async () => {
  const config = await prisma.smtpConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  if (!config) {
    // Return environment-based config as fallback
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      username: process.env.SMTP_USER || process.env.EMAIL_USER || '',
      password: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || '',
      encryption: process.env.SMTP_SECURE === 'true' ? 'SSL' : 'TLS',
      fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || '',
      fromName: 'Rasid راصد',
      isActive: true
    };
  }

  // Decrypt password before returning
  return {
    ...config,
    password: decryptPassword(config.password)
  };
};

export const createOrUpdateSmtpConfig = async (data: {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: string;
  fromEmail: string;
  fromName: string;
  createdBy?: number;
}) => {
  // Encrypt password
  const encryptedPassword = encryptPassword(data.password);

  // Deactivate all existing configs
  await prisma.smtpConfig.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  });

  // Create new config
  return await prisma.smtpConfig.create({
    data: {
      host: data.host,
      port: data.port,
      username: data.username,
      password: encryptedPassword,
      encryption: data.encryption,
      fromEmail: data.fromEmail,
      fromName: data.fromName,
      isActive: true,
      createdBy: data.createdBy
    }
  });
};
