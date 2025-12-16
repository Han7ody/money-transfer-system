/**
 * Credential Generation Utilities
 * Auto-generate usernames and secure passwords
 */

export class CredentialGenerator {
  /**
   * Generate username with prefix and incremental number
   */
  static async generateUsername(prefix: string, prisma: any): Promise<string> {
    // Get the highest number for this prefix by checking email
    const result = await prisma.$queryRaw`
      SELECT email 
      FROM users 
      WHERE email LIKE ${prefix + '%'}
      ORDER BY email DESC 
      LIMIT 1
    `;

    let nextNumber = 1;
    if (result && result.length > 0) {
      const lastEmail = result[0].email;
      const match = lastEmail.match(/\d+/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }

    return `${prefix}${nextNumber}`;
  }

  /**
   * Generate secure random password
   * 12 characters: uppercase, lowercase, numbers, special chars
   */
  static generatePassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const special = '@#$%&*';
    
    const all = uppercase + lowercase + numbers + special;
    
    let password = '';
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Generate agent username
   */
  static async generateAgentUsername(prisma: any): Promise<string> {
    return this.generateUsername('agent_', prisma);
  }

  /**
   * Generate admin username
   */
  static async generateAdminUsername(prisma: any): Promise<string> {
    return this.generateUsername('admin_', prisma);
  }
}
