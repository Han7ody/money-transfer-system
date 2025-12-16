import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PermissionService {
  /**
   * List all permissions grouped by category
   */
  async listPermissions() {
    const permissions = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        code,
        label,
        category,
        created_at
      FROM admin_permissions
      ORDER BY category, label
    `;

    // Group by category
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      permissions,
      grouped
    };
  }

  /**
   * Get permissions by category
   */
  async getPermissionsByCategory(category: string) {
    const permissions = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        code,
        label,
        category,
        created_at
      FROM admin_permissions
      WHERE category = ${category}
      ORDER BY label
    `;

    return permissions;
  }

  /**
   * Get permission by code
   */
  async getPermissionByCode(code: string) {
    const permission = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        code,
        label,
        category,
        created_at
      FROM admin_permissions
      WHERE code = ${code}
    `;

    if (permission.length === 0) {
      throw new Error('Permission not found');
    }

    return permission[0];
  }

  /**
   * Check if admin has permission
   */
  async hasPermission(adminId: number, permissionCode: string): Promise<boolean> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 1
      FROM admin_users au
      JOIN admin_role_permissions arp ON au.role_id = arp.role_id
      JOIN admin_permissions ap ON arp.permission_id = ap.id
      WHERE au.id = ${adminId} AND ap.code = ${permissionCode}
      LIMIT 1
    `;

    return result.length > 0;
  }

  /**
   * Check if admin has any of the permissions
   */
  async hasAnyPermission(adminId: number, permissionCodes: string[]): Promise<boolean> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 1
      FROM admin_users au
      JOIN admin_role_permissions arp ON au.role_id = arp.role_id
      JOIN admin_permissions ap ON arp.permission_id = ap.id
      WHERE au.id = ${adminId} AND ap.code = ANY(${permissionCodes})
      LIMIT 1
    `;

    return result.length > 0;
  }

  /**
   * Get admin permissions
   */
  async getAdminPermissions(adminId: number) {
    const permissions = await prisma.$queryRaw<any[]>`
      SELECT 
        ap.id,
        ap.code,
        ap.label,
        ap.category
      FROM admin_permissions ap
      JOIN admin_role_permissions arp ON ap.id = arp.permission_id
      JOIN admin_users au ON arp.role_id = au.role_id
      WHERE au.id = ${adminId}
      ORDER BY ap.category, ap.label
    `;

    return permissions;
  }

  /**
   * Get all permission categories
   */
  async getCategories() {
    const categories = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT category
      FROM admin_permissions
      ORDER BY category
    `;

    return categories.map(c => c.category);
  }

  /**
   * Create new permission (for system use)
   */
  async createPermission(code: string, label: string, category: string) {
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM admin_permissions WHERE code = ${code}
    `;

    if (existing.length > 0) {
      throw new Error('Permission code already exists');
    }

    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO admin_permissions (code, label, category, created_at)
      VALUES (${code}, ${label}, ${category}, NOW())
      RETURNING id, code, label, category
    `;

    return result[0];
  }
}

export default new PermissionService();
