# Sprint 5: Complete Admin Management System

## Overview
This document describes the complete backend implementation for the Sprint 5 Admin Management + Role System + Agent Management.

## Architecture

### Database Structure

#### 1. Admin Users Table (`admin_users`)
Separate admin accounts from customer accounts.

```sql
- id (PK)
- username (UNIQUE)
- full_name
- password_hash
- email (nullable)
- role_id (FK → admin_roles)
- status (ENUM: ACTIVE, SUSPENDED)
- last_login_at
- created_at
- updated_at
```

#### 2. Admin Roles Table (`admin_roles`)
```sql
- id (PK)
- role_name (UNIQUE)
- can_be_deleted (BOOLEAN)
- created_at
- updated_at
```

**Default Roles:**
- SUPER_ADMIN (cannot be deleted)
- ADMIN
- COMPLIANCE_OFFICER
- SUPPORT_AGENT

#### 3. Admin Permissions Table (`admin_permissions`)
```sql
- id (PK)
- code (UNIQUE) - e.g., USERS_VIEW, KYC_APPROVE
- label - Human-readable name
- category - Permission grouping
- created_at
```

**Permission Categories:**
- USER_MANAGEMENT
- KYC
- TRANSACTIONS
- AGENT_MANAGEMENT
- COMPLIANCE
- ADMIN_MANAGEMENT
- ROLE_MANAGEMENT
- SETTINGS
- SUPPORT
- SECURITY
- REPORTS

#### 4. Role-Permission Mapping (`admin_role_permissions`)
```sql
- id (PK)
- role_id (FK → admin_roles)
- permission_id (FK → admin_permissions)
```

#### 5. Agent Enhancements
Added to existing `agents` table:
```sql
- username (UNIQUE)
- password_hash
- performance_score (NUMERIC)
- last_activity_at
```

#### 6. Admin Audit Logs (`admin_audit_logs`)
```sql
- id (PK)
- admin_user_id (FK)
- action
- entity
- entity_id
- old_value (JSONB)
- new_value (JSONB)
- ip_address
- user_agent
- reason
- created_at
```

## Services

### 1. AdminUserService
**Location:** `backend/src/services/AdminUserService.ts`

**Methods:**
- `createAdminUser()` - Create new admin with auto-generated credentials
- `updateAdminUser()` - Update admin details
- `suspendAdmin()` - Suspend admin (prevents self-suspension)
- `activateAdmin()` - Reactivate suspended admin
- `resetPassword()` - Generate new password
- `listAdmins()` - List with filtering and pagination
- `authenticateAdminLogin()` - Separate admin login flow
- `updateLastLogin()` - Track login activity
- `getAdminPermissions()` - Get admin's permissions

### 2. RoleService
**Location:** `backend/src/services/RoleService.ts`

**Methods:**
- `listRoles()` - Get all roles with admin counts
- `getRoleById()` - Get role details
- `getRolePermissions()` - Get permissions for role
- `updateRolePermissions()` - Update role permissions (with validation)
- `createRole()` - Create new role
- `deleteRole()` - Delete role (if allowed)

**Business Rules:**
- SUPER_ADMIN role cannot remove mandatory permissions
- Cannot delete roles with assigned admins
- Cannot delete system roles (can_be_deleted = false)

### 3. PermissionService
**Location:** `backend/src/services/PermissionService.ts`

**Methods:**
- `listPermissions()` - Get all permissions grouped by category
- `getPermissionsByCategory()` - Filter by category
- `hasPermission()` - Check if admin has specific permission
- `hasAnyPermission()` - Check if admin has any of given permissions
- `getAdminPermissions()` - Get all permissions for admin

### 4. AgentService
**Location:** `backend/src/services/AgentService.ts`

**Methods:**
- `createAgent()` - Create agent with credentials
- `updateAgent()` - Update agent details
- `suspendAgent()` - Suspend agent
- `activateAgent()` - Activate agent
- `resetAgentAccess()` - Reset agent password
- `updatePerformanceScore()` - Update performance metric
- `getAgentProfile()` - Get agent details
- `listAgents()` - List with filtering
- `canDeleteAgent()` - Check if agent can be deleted

**Business Rules:**
- Agents cannot be deleted if linked to transactions
- Performance score must be 0-100
- Notifications sent on suspend/activate (stubbed)

## Controllers

### 1. AdminUserController
**Location:** `backend/src/controllers/AdminUserController.ts`

**Endpoints:**
- `POST /api/admin-management/admins/login` - Admin login
- `GET /api/admin-management/admins/profile` - Get current admin profile
- `POST /api/admin-management/admins` - Create admin
- `GET /api/admin-management/admins` - List admins
- `GET /api/admin-management/admins/:id` - Get admin
- `PUT /api/admin-management/admins/:id` - Update admin
- `PUT /api/admin-management/admins/:id/suspend` - Suspend admin
- `PUT /api/admin-management/admins/:id/activate` - Activate admin
- `PUT /api/admin-management/admins/:id/reset-password` - Reset password

### 2. RoleController
**Location:** `backend/src/controllers/RoleController.ts`

**Endpoints:**
- `GET /api/admin-management/roles` - List roles
- `POST /api/admin-management/roles` - Create role
- `GET /api/admin-management/roles/:id` - Get role
- `DELETE /api/admin-management/roles/:id` - Delete role
- `GET /api/admin-management/roles/:id/permissions` - Get role permissions
- `PUT /api/admin-management/roles/:id/permissions` - Update permissions
- `GET /api/admin-management/roles/permissions/all` - List all permissions

### 3. AgentManagementController
**Location:** `backend/src/controllers/AgentManagementController.ts`

**Endpoints:**
- `POST /api/agents` - Create agent
- `GET /api/agents` - List agents
- `GET /api/agents/:id` - Get agent
- `PUT /api/agents/:id` - Update agent
- `PUT /api/agents/:id/suspend` - Suspend agent
- `PUT /api/agents/:id/activate` - Activate agent
- `PUT /api/agents/:id/reset-access` - Reset agent password
- `PUT /api/agents/:id/performance` - Update performance score

## Security

### RBAC Middleware
**Location:** `backend/src/middleware/rbacMiddleware.ts`

**Functions:**
- `requirePermission(code)` - Check single permission
- `requireAnyPermission(codes[])` - Check any of permissions
- `requireAdmin()` - Check if user is admin
- `requireSuperAdmin()` - Check if user is super admin

**Usage Example:**
```typescript
router.post('/', requirePermission('ADMINS_CREATE'), AdminUserController.createAdmin);
```

### Admin Login Flow

1. **POST /api/admin-management/admins/login**
   - Validates username/password against `admin_users` table
   - Checks account status (ACTIVE/SUSPENDED)
   - Retrieves role and permissions
   - Updates `last_login_at`
   - Returns JWT with:
     ```json
     {
       "adminId": 1,
       "username": "superadmin",
       "roleId": 1,
       "roleName": "SUPER_ADMIN",
       "permissions": ["USERS_VIEW", "USERS_EDIT", ...]
     }
     ```

2. **JWT Verification**
   - Existing `authenticateToken` middleware works
   - RBAC middleware checks permissions from token or database

### Permission Checking

**From Token (Fast):**
```typescript
if (user.permissions.includes('USERS_VIEW')) {
  // Allow access
}
```

**From Database (Fallback):**
```typescript
const hasPermission = await PermissionService.hasPermission(adminId, 'USERS_VIEW');
```

## Migration & Seeding

### 1. Run Migration
```bash
cd scripts
node run-sprint5-complete.js
```

**Creates:**
- All admin system tables
- Default roles
- All permissions
- Role-permission mappings
- Default super admin account

### 2. Run Seeding
```bash
cd scripts
node seed-sprint5-admin-system.js
```

**Creates:**
- Sample admin users
- Sample agents with credentials
- Test data for development

### Default Credentials

**Super Admin:**
- Username: `superadmin`
- Password: `Admin@123`
- Email: `admin@rasid.com`

**Sample Admins (Password: Test@123):**
- `admin.ops` - Operations Admin
- `compliance.officer` - Compliance Officer
- `support.agent` - Support Agent

**Sample Agents (Password: Agent@123):**
- `agent.khartoum.001`
- `agent.omdurman.001`
- `agent.portsudan.001`

## API Examples

### Admin Login
```bash
POST /api/admin-management/admins/login
Content-Type: application/json

{
  "username": "superadmin",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "admin": {
      "id": 1,
      "username": "superadmin",
      "fullName": "Super Administrator",
      "email": "admin@rasid.com",
      "roleId": 1,
      "roleName": "SUPER_ADMIN",
      "permissions": ["USERS_VIEW", "USERS_EDIT", ...]
    }
  }
}
```

### Create Admin
```bash
POST /api/admin-management/admins
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "roleId": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": 5,
      "username": "john.doe",
      "full_name": "John Doe",
      "email": "john@example.com",
      "role_id": 2,
      "status": "ACTIVE"
    },
    "credentials": {
      "username": "john.doe",
      "password": "Xy9#mK2pL"
    }
  }
}
```

### Update Role Permissions
```bash
PUT /api/admin-management/roles/2/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissionIds": [1, 2, 3, 5, 8, 13]
}
```

### List Agents
```bash
GET /api/agents?city=Khartoum&status=ACTIVE&page=1&limit=20
Authorization: Bearer <token>
```

## Audit Logging

All admin actions are logged to `admin_audit_logs`:

```typescript
{
  admin_user_id: 1,
  action: 'CREATE_ADMIN',
  entity: 'admin_users',
  entity_id: '5',
  new_value: { username: 'john.doe', roleId: 2 },
  ip_address: '192.168.1.1',
  created_at: '2024-01-15T10:30:00Z'
}
```

**Logged Actions:**
- CREATE_ADMIN, UPDATE_ADMIN, SUSPEND_ADMIN, ACTIVATE_ADMIN
- RESET_PASSWORD
- CREATE_ROLE, UPDATE_ROLE_PERMISSIONS, DELETE_ROLE
- CREATE_AGENT, UPDATE_AGENT, SUSPEND_AGENT, ACTIVATE_AGENT
- RESET_AGENT_ACCESS, UPDATE_AGENT_PERFORMANCE

## Frontend Integration

### 1. Update Login Flow
```typescript
// Use new admin login endpoint
const response = await api.post('/admin-management/admins/login', {
  username,
  password
});

// Store token and permissions
localStorage.setItem('token', response.data.token);
localStorage.setItem('permissions', JSON.stringify(response.data.admin.permissions));
```

### 2. Permission Checking
```typescript
const hasPermission = (code: string) => {
  const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
  return permissions.includes(code);
};

// In components
{hasPermission('USERS_EDIT') && (
  <button onClick={handleEdit}>Edit User</button>
)}
```

### 3. API Calls
```typescript
// Admin management
await api.post('/admin-management/admins', adminData);
await api.get('/admin-management/admins?page=1&limit=20');
await api.put(`/admin-management/admins/${id}`, updateData);

// Role management
await api.get('/admin-management/roles');
await api.put(`/admin-management/roles/${roleId}/permissions`, { permissionIds });

// Agent management
await api.post('/agents', agentData);
await api.put(`/agents/${id}/suspend`, { reason });
```

## Testing

### 1. Test Admin Login
```bash
curl -X POST http://localhost:5000/api/admin-management/admins/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"Admin@123"}'
```

### 2. Test Permission Check
```bash
curl -X GET http://localhost:5000/api/admin-management/admins \
  -H "Authorization: Bearer <token>"
```

### 3. Test Agent Creation
```bash
curl -X POST http://localhost:5000/api/agents \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Agent",
    "phone": "+249912345999",
    "city": "Khartoum",
    "maxDailyAmount": 50000
  }'
```

## Troubleshooting

### Issue: Permission denied
**Solution:** Check if admin has required permission in `admin_role_permissions`

### Issue: Cannot login
**Solution:** Verify admin status is 'ACTIVE' and password is correct

### Issue: Role cannot be deleted
**Solution:** Check if role has `can_be_deleted = true` and no assigned admins

## Next Steps

1. **Frontend Integration:**
   - Update login page to use new endpoint
   - Implement permission-based UI rendering
   - Create admin management pages
   - Create role management pages

2. **Security Enhancements:**
   - Implement session management
   - Add 2FA support
   - Add password complexity rules
   - Add login attempt limiting

3. **Features:**
   - Email notifications for password resets
   - Activity dashboard for admins
   - Permission usage analytics
   - Role templates

## Files Created

### Database
- `scripts/database/sprint5-complete-admin-system.sql`
- `scripts/run-sprint5-complete.js`
- `scripts/seed-sprint5-admin-system.js`

### Services
- `backend/src/services/AdminUserService.ts`
- `backend/src/services/RoleService.ts`
- `backend/src/services/PermissionService.ts`
- `backend/src/services/AgentService.ts`

### Controllers
- `backend/src/controllers/AdminUserController.ts`
- `backend/src/controllers/RoleController.ts`
- `backend/src/controllers/AgentManagementController.ts`

### Routes
- `backend/src/routes/adminUserRoutes.ts`
- `backend/src/routes/roleRoutes.ts`
- `backend/src/routes/agentManagementRoutes.ts`

### Middleware
- `backend/src/middleware/rbacMiddleware.ts`

### Documentation
- `docs/SPRINT5_ADMIN_SYSTEM.md`
