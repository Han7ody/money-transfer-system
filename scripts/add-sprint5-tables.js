require('dotenv').config({ path: './backend/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSprint5Tables() {
  try {
    console.log('Creating role_permissions table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role VARCHAR(50) NOT NULL,
        permission VARCHAR(100) NOT NULL,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(role, permission)
      )
    `;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission)`;
    console.log('✓ role_permissions created');

    console.log('Creating agent_credentials table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS agent_credentials (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(agent_id)
      )
    `;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_agent_credentials_agent ON agent_credentials(agent_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_agent_credentials_username ON agent_credentials(username)`;
    console.log('✓ agent_credentials created');

    console.log('Creating password_reset_history table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS password_reset_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reset_by INTEGER REFERENCES users(id),
        reason TEXT,
        reset_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_history(user_id)`;
    console.log('✓ password_reset_history created');

    console.log('Seeding role permissions...');
    const permissions = [
      ['SUPER_ADMIN', 'KYC_REVIEW'], ['SUPER_ADMIN', 'TRANSACTION_APPROVAL'],
      ['SUPER_ADMIN', 'COMPLIANCE_DASHBOARD'], ['SUPER_ADMIN', 'MANAGE_ADMINS'],
      ['SUPER_ADMIN', 'MANAGE_AGENTS'], ['SUPER_ADMIN', 'BLOCK_USERS'],
      ['SUPER_ADMIN', 'VIEW_REPORTS'], ['SUPER_ADMIN', 'SUPPORT_ESCALATION'],
      ['SUPER_ADMIN', 'MANAGE_ROLES'], ['SUPER_ADMIN', 'SYSTEM_SETTINGS'],
      ['ADMIN', 'KYC_REVIEW'], ['ADMIN', 'TRANSACTION_APPROVAL'],
      ['ADMIN', 'COMPLIANCE_DASHBOARD'], ['ADMIN', 'MANAGE_AGENTS'],
      ['ADMIN', 'BLOCK_USERS'], ['ADMIN', 'VIEW_REPORTS'],
      ['ADMIN', 'SUPPORT_ESCALATION'],
      ['COMPLIANCE', 'KYC_REVIEW'], ['COMPLIANCE', 'COMPLIANCE_DASHBOARD'],
      ['COMPLIANCE', 'VIEW_REPORTS'], ['COMPLIANCE', 'BLOCK_USERS'],
      ['SUPPORT', 'SUPPORT_ESCALATION']
    ];

    for (const [role, permission] of permissions) {
      try {
        await prisma.$executeRaw`
          INSERT INTO role_permissions (role, permission, enabled)
          VALUES (${role}, ${permission}, true)
          ON CONFLICT (role, permission) DO NOTHING
        `;
      } catch (e) {
        // Ignore duplicates
      }
    }
    console.log('✓ Permissions seeded');

    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM role_permissions`;
    console.log(`\n✓ Sprint 5 completed! ${Number(count[0].count)} permissions configured`);

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addSprint5Tables();
