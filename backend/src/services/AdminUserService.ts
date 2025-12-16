import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CredentialGenerator } from '../utils/credentialGenerator';

const prisma = new PrismaClient();

interface CreateAdminInput {
  username?: string;
  fullName: string;
  email?: string;
  roleId: number;
  password?: string;
  createdBy: number;
}

interface UpdateAdminInput {
  fullName?: string;
  email?: string;
  roleId?: number;
}

interface AdminListFilters {
  roleId?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class AdminUserService {
  /**
   * Create a new admin user
   */
  async createAdminUser(input: CreateAdminInput) {
    const { username, fullName, email, roleId, password, createdBy } = input;

    // Generate username if not provided
    const finalUsername = username || await this.generateUsername(fullName);

    // Check if username exists
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM admin_users WHERE username = ${finalUsername}
    `;
    
    if (existing.length > 0) {
      throw new Error('Username already exists');
    }

    // Generate password if not provided
    const finalPassword = password || CredentialGenerator.generatePassword();
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    // Create admin user
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO admin_users (username, full_name, password_hash, email, role_id, status, created_at, updated_at)
      VALUES (${finalUsername}, ${fullName}, ${passwordHash}, ${email || null}, ${roleId}, 'ACTIVE', NOW(), NOW())
      RETURNING id, username, full_name, email, role_id, status, created_at
    `;

    // Log audit
    await this.logAudit({
      adminUserId: createdBy,
      action: 'CREATE_ADMIN',
      entity: 'admin_users',
      entityId: String(result[0].id),
      newValue: { username: finalUsername, fullName, roleId }
    });

    return {
      admin: result[0],
      credentials: { username: finalUsername, password: finalPassword }
    };
  }

  /**
   * Update admin user
   */
  async updateAdminUser(adminId: number, input: UpdateAdminInput, updatedBy: number) {
    const { fullName, email, roleId } = input;

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (fullName) {
      updates.push(`full_name = $${paramIndex++}`);
      params.push(fullName);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      params.push(email);
    }
    if (roleId) {
      updates.push(`role_id = $${paramIndex++}`);
      params.push(roleId);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    params.push(adminId);

    await prisma.$queryRawUnsafe(`
      UPDATE admin_users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, ...params);

    await this.logAudit({
      adminUserId: updatedBy,
      action: 'UPDATE_ADMIN',
      entity: 'admin_users',
      entityId: String(adminId),
      newValue: input
    });
  }

  /**
   * Suspend admin user
   */
  async suspendAdmin(adminId: number, reason: string, suspendedBy: number) {
    // Prevent self-suspension
    if (adminId === suspendedBy) {
      throw new Error('Cannot suspend yourself');
    }

    await prisma.$executeRaw`
      UPDATE admin_users
      SET status = 'SUSPENDED', updated_at = NOW()
      WHERE id = ${adminId}
    `;

    await this.logAudit({
      adminUserId: suspendedBy,
      action: 'SUSPEND_ADMIN',
      entity: 'admin_users',
      entityId: String(adminId),
      newValue: { reason }
    });
  }

  /**
   * Activate admin user
   */
  async activateAdmin(adminId: number, activatedBy: number) {
    await prisma.$executeRaw`
      UPDATE admin_users
      SET status = 'ACTIVE', updated_at = NOW()
      WHERE id = ${adminId}
    `;

    await this.logAudit({
      adminUserId: activatedBy,
      action: 'ACTIVATE_ADMIN',
      entity: 'admin_users',
      entityId: String(adminId)
    });
  }

  /**
   * Reset admin password
   */
  async resetPassword(adminId: number, reason: string, resetBy: number) {
    const newPassword = CredentialGenerator.generatePassword();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$executeRaw`
      UPDATE admin_users
      SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE id = ${adminId}
    `;

    await prisma.$executeRaw`
      INSERT INTO admin_password_resets (admin_user_id, reset_by, reason, reset_type, created_at)
      VALUES (${adminId}, ${resetBy}, ${reason}, 'ADMIN_RESET', NOW())
    `;

    await this.logAudit({
      adminUserId: resetBy,
      action: 'RESET_PASSWORD',
      entity: 'admin_users',
      entityId: String(adminId),
      newValue: { reason }
    });

    return newPassword;
  }

  /**
   * List admins with filtering and pagination
   */
  async listAdmins(filters: AdminListFilters = {}) {
    const { roleId, status, search, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (roleId) {
      whereConditions.push(`au.role_id = $${paramIndex++}`);
      params.push(roleId);
    }

    if (status) {
      whereConditions.push(`au.status = $${paramIndex++}`);
      params.push(status);
    }

    if (search) {
      whereConditions.push(`(au.username ILIKE $${paramIndex} OR au.full_name ILIKE $${paramIndex} OR au.email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    params.push(limit, offset);

    const admins = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        au.id,
        au.username,
        au.full_name,
        au.email,
        au.role_id,
        ar.role_name,
        au.status,
        au.last_login_at,
        au.created_at,
        au.updated_at
      FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      ${whereClause}
      ORDER BY au.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `, ...params);

    const countResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*)::int as total
      FROM admin_users au
      ${whereClause}
    `, ...params.slice(0, params.length - 2));

    return {
      admins,
      total: countResult[0].total,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  }

  /**
   * Authenticate admin login
   */
  async authenticateAdminLogin(username: string, password: string, ipAddress?: string) {
    // Support both username and email for login
    const admin = await prisma.$queryRaw<any[]>`
      SELECT 
        au.id,
        au.username,
        au.full_name,
        au.password_hash,
        au.email,
        au.role_id,
        au.status,
        ar.role_name
      FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.username = ${username} OR au.email = ${username}
    `;

    if (admin.length === 0) {
      throw new Error('Invalid credentials');
    }

    const adminUser = admin[0];

    if (adminUser.status !== 'ACTIVE') {
      throw new Error('Account is suspended');
    }

    const isValidPassword = await bcrypt.compare(password, adminUser.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Get permissions
    const permissions = await this.getAdminPermissions(adminUser.role_id);

    // Update last login
    await this.updateLastLogin(adminUser.id);

    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: adminUser.id,
        username: adminUser.username,
        roleId: adminUser.role_id,
        roleName: adminUser.role_name,
        permissions: permissions.map(p => p.code)
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars',
      { expiresIn: '8h' }
    );

    return {
      token,
      admin: {
        id: adminUser.id,
        username: adminUser.username,
        fullName: adminUser.full_name,
        email: adminUser.email,
        roleId: adminUser.role_id,
        roleName: adminUser.role_name,
        permissions: permissions.map(p => p.code)
      }
    };
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(adminId: number) {
    await prisma.$executeRaw`
      UPDATE admin_users
      SET last_login_at = NOW()
      WHERE id = ${adminId}
    `;
  }

  /**
   * Get admin permissions
   */
  async getAdminPermissions(roleId: number) {
    const permissions = await prisma.$queryRaw<any[]>`
      SELECT 
        ap.id,
        ap.code,
        ap.label,
        ap.category
      FROM admin_permissions ap
      JOIN admin_role_permissions arp ON ap.id = arp.permission_id
      WHERE arp.role_id = ${roleId}
      ORDER BY ap.category, ap.label
    `;

    return permissions;
  }

  /**
   * Generate unique username
   */
  private async generateUsername(fullName: string): Promise<string> {
    const base = fullName
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.]/g, '');
    
    let username = base;
    let counter = 1;

    while (true) {
      const existing = await prisma.$queryRaw<any[]>`
        SELECT id FROM admin_users WHERE username = ${username}
      `;

      if (existing.length === 0) {
        return username;
      }

      username = `${base}${counter}`;
      counter++;
    }
  }

  /**
   * Log audit action
   */
  private async logAudit(data: {
    adminUserId: number;
    action: string;
    entity: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    reason?: string;
  }) {
    await prisma.$executeRaw`
      INSERT INTO admin_audit_logs (
        admin_user_id, action, entity, entity_id, old_value, new_value, ip_address, reason, created_at
      )
      VALUES (
        ${data.adminUserId},
        ${data.action},
        ${data.entity},
        ${data.entityId || null},
        ${data.oldValue ? JSON.stringify(data.oldValue) : null}::jsonb,
        ${data.newValue ? JSON.stringify(data.newValue) : null}::jsonb,
        ${data.ipAddress || null},
        ${data.reason || null},
        NOW()
      )
    `;
  }
}

export default new AdminUserService();
