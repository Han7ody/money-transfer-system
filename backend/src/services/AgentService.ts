import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CredentialGenerator } from '../utils/credentialGenerator';

const prisma = new PrismaClient();

interface CreateAgentInput {
  fullName: string;
  phone: string;
  whatsapp?: string;
  city: string;
  country?: string;
  maxDailyAmount: number;
  notes?: string;
  username?: string;
  password?: string;
  createdBy: number;
}

interface UpdateAgentInput {
  fullName?: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  maxDailyAmount?: number;
  notes?: string;
  performanceScore?: number;
}

interface AgentListFilters {
  city?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class AgentService {
  /**
   * Create new agent
   */
  async createAgent(input: CreateAgentInput) {
    const { fullName, phone, whatsapp, city, country, maxDailyAmount, notes, username, password, createdBy } = input;

    // Generate credentials
    const finalUsername = username || await CredentialGenerator.generateAgentUsername(prisma);
    const finalPassword = password || CredentialGenerator.generatePassword();
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    // Check if phone exists
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM agents WHERE phone = ${phone}
    `;

    if (existing.length > 0) {
      throw new Error('Phone number already exists');
    }

    // Create agent
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO agents (
        full_name, phone, whatsapp, city, country, status, 
        max_daily_amount, current_daily_amount, active_transactions, 
        total_transactions, notes, username, password_hash, 
        performance_score, created_at, updated_at
      )
      VALUES (
        ${fullName}, ${phone}, ${whatsapp || null}, ${city}, ${country || 'Sudan'},
        'ACTIVE', ${maxDailyAmount}, 0, 0, 0, ${notes || null},
        ${finalUsername}, ${passwordHash}, 0, NOW(), NOW()
      )
      RETURNING id, full_name, phone, city, status, username
    `;

    // Log audit
    await this.logAudit({
      adminUserId: createdBy,
      action: 'CREATE_AGENT',
      entity: 'agents',
      entityId: String(result[0].id),
      newValue: { fullName, phone, city, username: finalUsername }
    });

    return {
      agent: result[0],
      credentials: { username: finalUsername, password: finalPassword }
    };
  }

  /**
   * Update agent
   */
  async updateAgent(agentId: number, input: UpdateAgentInput, updatedBy: number) {
    const { fullName, phone, whatsapp, city, maxDailyAmount, notes, performanceScore } = input;

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (fullName) {
      updates.push(`full_name = $${paramIndex++}`);
      params.push(fullName);
    }
    if (phone) {
      updates.push(`phone = $${paramIndex++}`);
      params.push(phone);
    }
    if (whatsapp !== undefined) {
      updates.push(`whatsapp = $${paramIndex++}`);
      params.push(whatsapp);
    }
    if (city) {
      updates.push(`city = $${paramIndex++}`);
      params.push(city);
    }
    if (maxDailyAmount !== undefined) {
      updates.push(`max_daily_amount = $${paramIndex++}`);
      params.push(maxDailyAmount);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      params.push(notes);
    }
    if (performanceScore !== undefined) {
      updates.push(`performance_score = $${paramIndex++}`);
      params.push(performanceScore);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    params.push(agentId);

    await prisma.$queryRawUnsafe(`
      UPDATE agents
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, ...params);

    await this.logAudit({
      adminUserId: updatedBy,
      action: 'UPDATE_AGENT',
      entity: 'agents',
      entityId: String(agentId),
      newValue: input
    });
  }

  /**
   * Suspend agent
   */
  async suspendAgent(agentId: number, reason: string, suspendedBy: number) {
    await prisma.$executeRaw`
      UPDATE agents
      SET status = 'SUSPENDED', updated_at = NOW()
      WHERE id = ${agentId}
    `;

    await this.logAudit({
      adminUserId: suspendedBy,
      action: 'SUSPEND_AGENT',
      entity: 'agents',
      entityId: String(agentId),
      newValue: { reason }
    });

    // TODO: Send notification
  }

  /**
   * Activate agent
   */
  async activateAgent(agentId: number, activatedBy: number) {
    await prisma.$executeRaw`
      UPDATE agents
      SET status = 'ACTIVE', updated_at = NOW()
      WHERE id = ${agentId}
    `;

    await this.logAudit({
      adminUserId: activatedBy,
      action: 'ACTIVATE_AGENT',
      entity: 'agents',
      entityId: String(agentId)
    });

    // TODO: Send notification
  }

  /**
   * Reset agent access (password)
   */
  async resetAgentAccess(agentId: number, reason: string, resetBy: number) {
    const newPassword = CredentialGenerator.generatePassword();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$executeRaw`
      UPDATE agents
      SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE id = ${agentId}
    `;

    await this.logAudit({
      adminUserId: resetBy,
      action: 'RESET_AGENT_ACCESS',
      entity: 'agents',
      entityId: String(agentId),
      newValue: { reason }
    });

    // TODO: Send notification via SMS/Email

    return newPassword;
  }

  /**
   * Update performance score
   */
  async updatePerformanceScore(agentId: number, score: number, updatedBy: number) {
    if (score < 0 || score > 100) {
      throw new Error('Performance score must be between 0 and 100');
    }

    await prisma.$executeRaw`
      UPDATE agents
      SET performance_score = ${score}, updated_at = NOW()
      WHERE id = ${agentId}
    `;

    await this.logAudit({
      adminUserId: updatedBy,
      action: 'UPDATE_AGENT_PERFORMANCE',
      entity: 'agents',
      entityId: String(agentId),
      newValue: { performanceScore: score }
    });
  }

  /**
   * Get agent profile
   */
  async getAgentProfile(agentId: number) {
    const agent = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        full_name,
        phone,
        whatsapp,
        city,
        country,
        status,
        max_daily_amount,
        current_daily_amount,
        active_transactions,
        total_transactions,
        notes,
        username,
        performance_score,
        last_activity_at,
        created_at,
        updated_at
      FROM agents
      WHERE id = ${agentId}
    `;

    if (agent.length === 0) {
      throw new Error('Agent not found');
    }

    return agent[0];
  }

  /**
   * List agents with filtering and pagination
   */
  async listAgents(filters: AgentListFilters = {}) {
    const { city, status, search, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (city) {
      whereConditions.push(`city = $${paramIndex++}`);
      params.push(city);
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex++}::agent_status`);
      params.push(status);
    }

    if (search) {
      whereConditions.push(`(full_name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex} OR username ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    params.push(limit, offset);

    const agents = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id,
        full_name,
        phone,
        whatsapp,
        city,
        country,
        status,
        max_daily_amount,
        current_daily_amount,
        active_transactions,
        total_transactions,
        username,
        performance_score,
        last_activity_at,
        created_at,
        updated_at
      FROM agents
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `, ...params);

    const countResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*)::int as total
      FROM agents
      ${whereClause}
    `, ...params.slice(0, params.length - 2));

    return {
      agents,
      total: countResult[0].total,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  }

  /**
   * Check if agent can be deleted
   */
  async canDeleteAgent(agentId: number): Promise<boolean> {
    const transactions = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count
      FROM transactions
      WHERE assigned_agent_id = ${agentId} OR pickup_verified_by_agent_id = ${agentId}
    `;

    return transactions[0].count === 0;
  }

  /**
   * Update last activity
   */
  async updateLastActivity(agentId: number) {
    await prisma.$executeRaw`
      UPDATE agents
      SET last_activity_at = NOW()
      WHERE id = ${agentId}
    `;
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

export default new AgentService();
