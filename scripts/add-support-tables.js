require('dotenv').config({ path: './backend/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSupportTables() {
  try {
    console.log('Creating support_requests table...');
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS support_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_name VARCHAR(255),
        issue_category VARCHAR(50) NOT NULL CHECK (issue_category IN ('GENERAL', 'KYC', 'TRANSACTION', 'AGENT', 'COMPLAINT')),
        issue_description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'ESCALATED')),
        assigned_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP,
        escalated_at TIMESTAMP
      )
    `;
    console.log('✓ support_requests table created');

    console.log('Creating indexes for support_requests...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_support_requests_category ON support_requests(issue_category)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_support_requests_assigned ON support_requests(assigned_admin_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_support_requests_created ON support_requests(created_at DESC)`;
    console.log('✓ Indexes created');

    console.log('Creating support_notes table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS support_notes (
        id SERIAL PRIMARY KEY,
        support_request_id INTEGER NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
        admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        note_text TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✓ support_notes table created');

    console.log('Creating indexes for support_notes...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_support_notes_request ON support_notes(support_request_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_support_notes_created ON support_notes(created_at DESC)`;
    console.log('✓ Indexes created');

    // Verify
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('support_requests', 'support_notes')
    `;

    console.log('\n✓ Sprint 4 Support System tables created successfully!');
    console.log('Tables:', tables);

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addSupportTables();
