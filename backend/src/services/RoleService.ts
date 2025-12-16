import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RoleService {
  /**
   * List all roles
   */
  async listRoles() {
    const roles = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        role_name,
        can_be_deleted,
        created_at,
        updated_at,
        (SELECT COUNT(*)::int FROM admin_users WHERE role_id = admin_roles.id) as admin_count
      FROM admin_roles
      ORDER BY 
        CASE role_name
          WHEN 'SUPER_ADMIN' THEN 1
          WHEN 'ADMIN' THEN 2
          WHEN 'COMPLIANCE_OFFICER' THEN 3
          WHEN 'SUPPORT_AGENT' THEN 4
          ELSE 5
        END,
        role_name
    `;

    return roles;
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId: number) {
    const role = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        role_name,
        can_be_deleted,
        created_at,
        updated_at
      FROM admin_roles
      WHERE id = ${roleId}
    `;

    if (role.length === 0) {
      throw new Error('Role not found');
    }

    return role[0];
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(roleId: number) {
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
   * Update role permissions
   */
  async updateRolePermissions(roleId: number, permissionIds: number[], updatedBy: number) {
    // Check if role exists and can be modified
    const role = await this.getRoleById(roleId);

    // Validate permission IDs
    const validPermissions = await prisma.$queryRaw<any[]>`
      SELECT id FROM admin_permissions WHERE id = ANY(${permissionIds})
    `;

    if (validPermissions.length !== permissionIds.length) {
      throw new Error('Invalid permission IDs provided');
    }

    // For SUPER_ADMIN, ensure all critical permissions remain
    if (role.role_name === 'SUPER_ADMIN') {
      const criticalPermissions = await prisma.$queryRaw<any[]>`
        SELECT id FROM admin_permissions 
        WHERE code IN ('ADMINS_VIEW', 'ADMINS_CREATE', 'ROLES_VIEW', 'ROLES_ASSIGN_PERMISSIONS')
      `;

      const criticalIds = criticalPermissions.map(p => p.id);
      const hasAllCritical = criticalIds.every(id => permissionIds.includes(id));

      if (!hasAllCritical) {
        throw new Error('Cannot remove mandatory SUPER_ADMIN permissions');
      }
    }

    // Delete existing permissions
    await prisma.$executeRaw`
      DELETE FROM admin_role_permissions WHERE role_id = ${roleId}
    `;

    // Insert new permissions
    for (const permissionId of permissionIds) {
      await prisma.$executeRaw`
        INSERT INTO admin_role_permissions (role_id, permission_id, created_at)
        VALUES (${roleId}, ${permissionId}, NOW())
      `;
    }

    // Log audit
    await this.logAudit({
      adminUserId: updatedBy,
      action: 'UPDATE_ROLE_PERMISSIONS',
      entity: 'admin_roles',
      entityId: String(roleId),
      newValue: { permissionIds }
    });

    // Invalidate permission cache (if implemented)
    await this.invalidatePermissionCache(roleId);
  }

  /**
   * Create new role
   */
  async createRole(roleName: string, permissionIds: number[], createdBy: number) {
    // Check if role name exists
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM admin_roles WHERE role_name = ${roleName}
    `;

    if (existing.length > 0) {
      throw new Error('Role name already exists');
    }

    // Create role
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO admin_roles (role_name, can_be_deleted, created_at, updated_at)
      VALUES (${roleName}, true, NOW(), NOW())
      RETURNING id, role_name, can_be_deleted
    `;

    const newRole = result[0];

    // Assign permissions
    if (permissionIds.length > 0) {
      await this.updateRolePermissions(newRole.id, permissionIds, createdBy);
    }

    await this.logAudit({
      adminUserId: createdBy,
      action: 'CREATE_ROLE',
      entity: 'admin_roles',
      entityId: String(newRole.id),
      newValue: { roleName, permissionIds }
    });

    return newRole;
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: number, deletedBy: number) {
    const role = await this.getRoleById(roleId);

    if (!role.can_be_deleted) {
      throw new Error('This role cannot be deleted');
    }

    // Check if any admins are assigned to this role
    const adminCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count FROM admin_users WHERE role_id = ${roleId}
    `;

    if (adminCount[0].count > 0) {
      throw new Error('Cannot delete role with assigned admins');
    }

    // Delete role (cascade will handle permissions)
    await prisma.$executeRaw`
      DELETE FROM admin_roles WHERE id = ${roleId}
    `;

    await this.logAudit({
      adminUserId: deletedBy,
      action: 'DELETE_ROLE',
      entity: 'admin_roles',
      entityId: String(roleId),
      oldValue: { roleName: role.role_name }
    });
  }

  /**
   * Invalidate permission cache
   */
  private async invalidatePermissionCache(roleId: number) {
    // Stub for cache invalidation
    // In production, this would clear Redis/memory cache
    // Permission cache invalidated
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
  }) {
    await prisma.$executeRaw`
      INSERT INTO admin_audit_logs (
        admin_user_id, action, entity, entity_id, old_value, new_value, created_at
      )
      VALUES (
        ${data.adminUserId},
        ${data.action},
        ${data.entity},
        ${data.entityId || null},
        ${data.oldValue ? JSON.stringify(data.oldValue) : null}::jsonb,
        ${data.newValue ? JSON.stringify(data.newValue) : null}::jsonb,
        NOW()
      )
    `;
  }
}

export default new RoleService();
