const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedAdminSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting Sprint 5 Admin System Seeding...\n');
    
    await client.query('BEGIN');

    // 1. Create default super admin with proper password hash
    console.log('👤 Creating default Super Admin...');
    const password = 'Admin@123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    const superAdminRole = await client.query(`
      SELECT id FROM admin_roles WHERE role_name = 'SUPER_ADMIN'
    `);

    if (superAdminRole.rows.length > 0) {
      await client.query(`
        INSERT INTO admin_users (username, full_name, password_hash, email, role_id, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW(), NOW())
        ON CONFLICT (username) DO UPDATE
        SET password_hash = $3, updated_at = NOW()
      `, ['superadmin', 'Super Administrator', passwordHash, 'admin@rasid.com', superAdminRole.rows[0].id]);
      
      console.log('   ✅ Super Admin created/updated');
      console.log(`   📧 Email: admin@rasid.com`);
      console.log(`   🔑 Password: ${password}`);
    }

    // 2. Create sample admin users for testing
    console.log('\n👥 Creating sample admin users...');
    
    const adminRole = await client.query(`
      SELECT id FROM admin_roles WHERE role_name = 'ADMIN'
    `);

    const complianceRole = await client.query(`
      SELECT id FROM admin_roles WHERE role_name = 'COMPLIANCE_OFFICER'
    `);

    const supportRole = await client.query(`
      SELECT id FROM admin_roles WHERE role_name = 'SUPPORT_AGENT'
    `);

    const sampleAdmins = [
      {
        username: 'admin.ops',
        fullName: 'Operations Admin',
        email: 'ops@rasid.com',
        roleId: adminRole.rows[0]?.id
      },
      {
        username: 'compliance.officer',
        fullName: 'Compliance Officer',
        email: 'compliance@rasid.com',
        roleId: complianceRole.rows[0]?.id
      },
      {
        username: 'support.agent',
        fullName: 'Support Agent',
        email: 'support@rasid.com',
        roleId: supportRole.rows[0]?.id
      }
    ];

    for (const admin of sampleAdmins) {
      if (admin.roleId) {
        const samplePassword = 'Test@123';
        const sampleHash = await bcrypt.hash(samplePassword, 10);
        
        await client.query(`
          INSERT INTO admin_users (username, full_name, password_hash, email, role_id, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW(), NOW())
          ON CONFLICT (username) DO NOTHING
        `, [admin.username, admin.fullName, sampleHash, admin.email, admin.roleId]);
        
        console.log(`   ✅ ${admin.fullName} (${admin.username})`);
      }
    }

    // 3. Verify permissions
    console.log('\n🔐 Verifying permissions...');
    const permCount = await client.query('SELECT COUNT(*) FROM admin_permissions');
    console.log(`   ✅ ${permCount.rows[0].count} permissions available`);

    // 4. Verify role-permission mappings
    console.log('\n🔗 Verifying role-permission mappings...');
    const roleMappings = await client.query(`
      SELECT 
        ar.role_name,
        COUNT(arp.permission_id) as permission_count
      FROM admin_roles ar
      LEFT JOIN admin_role_permissions arp ON ar.id = arp.role_id
      GROUP BY ar.role_name
      ORDER BY ar.role_name
    `);

    roleMappings.rows.forEach(row => {
      console.log(`   ✅ ${row.role_name}: ${row.permission_count} permissions`);
    });

    // 5. Create sample agents with credentials
    console.log('\n🏪 Creating sample agents...');
    
    const sampleAgents = [
      {
        fullName: 'Ahmed Al-Rashid',
        phone: '+249912345001',
        city: 'Khartoum',
        username: 'agent.khartoum.001'
      },
      {
        fullName: 'Fatima Hassan',
        phone: '+249912345002',
        city: 'Omdurman',
        username: 'agent.omdurman.001'
      },
      {
        fullName: 'Mohammed Ali',
        phone: '+249912345003',
        city: 'Port Sudan',
        username: 'agent.portsudan.001'
      }
    ];

    for (const agent of sampleAgents) {
      const agentPassword = 'Agent@123';
      const agentHash = await bcrypt.hash(agentPassword, 10);
      
      await client.query(`
        INSERT INTO agents (
          full_name, phone, city, country, status, 
          max_daily_amount, current_daily_amount, active_transactions, 
          total_transactions, username, password_hash, performance_score,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, 'Sudan', 'ACTIVE', 50000, 0, 0, 0, $4, $5, 85, NOW(), NOW())
        ON CONFLICT (phone) DO UPDATE
        SET username = $4, password_hash = $5, updated_at = NOW()
      `, [agent.fullName, agent.phone, agent.city, agent.username, agentHash]);
      
      console.log(`   ✅ ${agent.fullName} (${agent.username})`);
    }

    await client.query('COMMIT');
    
    console.log('\n✅ Sprint 5 Admin System Seeding completed successfully!\n');
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Super Admin:');
    console.log('  Username: superadmin');
    console.log('  Password: Admin@123');
    console.log('  Email: admin@rasid.com');
    console.log('');
    console.log('Sample Admins (all use password: Test@123):');
    console.log('  - admin.ops');
    console.log('  - compliance.officer');
    console.log('  - support.agent');
    console.log('');
    console.log('Sample Agents (all use password: Agent@123):');
    console.log('  - agent.khartoum.001');
    console.log('  - agent.omdurman.001');
    console.log('  - agent.portsudan.001');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT: Change all default passwords in production!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedAdminSystem().catch(console.error);
