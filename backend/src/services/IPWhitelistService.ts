import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

export class IPWhitelistService {
  /**
   * Check if IP is whitelisted
   */
  async isWhitelisted(ipAddress: string): Promise<boolean> {
    try {
      // If no whitelist entries exist, allow all (whitelist disabled)
      const count = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM ip_whitelist WHERE is_active = true
      `;

      const activeCount = Number(count[0].count);


      if (activeCount === 0) {

        return true; // Whitelist disabled
      }

      // Check if IP is in whitelist
      const result = await prisma.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM ip_whitelist
        WHERE ip_address = ${ipAddress} AND is_active = true
        LIMIT 1
      `;

      const isAllowed = result.length > 0;

      
      return isAllowed;
    } catch (error: any) {
      // If table doesn't exist, allow all access
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[IPWhitelistService] Table not found - allowing all access');
        return true;
      }
      throw error;
    }
  }

  /**
   * Add IP to whitelist
   */
  async addIP(ipAddress: string, description: string, addedBy: number): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO ip_whitelist (ip_address, description, added_by, is_active)
        VALUES (${ipAddress}, ${description}, ${addedBy}, true)
        ON CONFLICT (ip_address) DO UPDATE
        SET is_active = true, description = ${description}, updated_at = NOW()
      `;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        throw new Error('IP whitelist table not found. Please run the security migration.');
      }
      throw error;
    }
  }

  /**
   * Remove IP from whitelist
   */
  async removeIP(ipAddress: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        UPDATE ip_whitelist
        SET is_active = false, updated_at = NOW()
        WHERE ip_address = ${ipAddress}
      `;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        throw new Error('IP whitelist table not found. Please run the security migration.');
      }
      throw error;
    }
  }

  /**
   * Get all whitelisted IPs
   */
  async getAllIPs(): Promise<any[]> {
    try {
      return await prisma.$queryRaw`
        SELECT 
          id, 
          ip_address, 
          description, 
          added_by, 
          is_active, 
          created_at,
          updated_at
        FROM ip_whitelist
        WHERE is_active = true
        ORDER BY created_at DESC
      `;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[IPWhitelistService] Table not found - returning empty list');
        return [];
      }
      throw error;
    }
  }

  /**
   * Extract IP address from request
   */
  extractIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || req.ip || 'unknown';
  }

  /**
   * Check if whitelist is enabled
   */
  async isEnabled(): Promise<boolean> {
    try {
      const count = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM ip_whitelist WHERE is_active = true
      `;
      return Number(count[0].count) > 0;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[IPWhitelistService] Table not found - whitelist disabled');
        return false;
      }
      throw error;
    }
  }
}

export const ipWhitelistService = new IPWhitelistService();
