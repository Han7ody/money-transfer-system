// backend/src/controllers/agentController.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { logAuditAction } from '../utils/auditLogger';
import { sendSuccess, sendError } from '../utils/response';
import { Prisma } from '@prisma/client';
import { eventEmitter } from '../events/eventEmitter';
import { EventType } from '../events/eventTypes';

// Get all agents with filters
export const getAllAgents = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      search, 
      status, 
      city, 
      page = 1, 
      limit = 20 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where: Prisma.AgentWhereInput = {};

    if (search) {
      where.OR = [
        { fullName: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search) } },
        { city: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status as any;
    }

    if (city) {
      where.city = { contains: String(city), mode: 'insensitive' };
    }

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              assignedTransactions: true
            }
          }
        }
      }),
      prisma.agent.count({ where })
    ]);

    return sendSuccess(res, {
      agents,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Get all agents error:', error);
    return sendError(res, 'Failed to fetch agents', 500);
  }
};

// Get agent by ID
export const getAgentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id: parseInt(id) },
      include: {
        assignedTransactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            transactionRef: true,
            status: true,
            amountReceived: true,
            pickupCity: true,
            createdAt: true,
            recipientName: true
          }
        },
        _count: {
          select: {
            assignedTransactions: true,
            verifiedPickups: true
          }
        }
      }
    });

    if (!agent) {
      return sendError(res, 'Agent not found', 404);
    }

    return sendSuccess(res, agent);
  } catch (error: any) {
    console.error('Get agent by ID error:', error);
    return sendError(res, 'Failed to fetch agent', 500);
  }
};

// Create new agent
export const createAgent = async (req: AuthRequest, res: Response) => {
  try {
    const {
      fullName,
      phone,
      whatsapp,
      city,
      country = 'Sudan',
      maxDailyAmount,
      notes
    } = req.body;

    // Validation
    if (!fullName || !phone || !city || !maxDailyAmount) {
      return sendError(res, 'Full name, phone, city, and max daily amount are required', 400);
    }

    // Check if phone already exists
    const existingAgent = await prisma.agent.findUnique({
      where: { phone }
    });

    if (existingAgent) {
      return sendError(res, 'Agent with this phone number already exists', 400);
    }

    // Create agent
    const agent = await prisma.agent.create({
      data: {
        fullName,
        phone,
        whatsapp: whatsapp || phone,
        city,
        country,
        maxDailyAmount: parseFloat(maxDailyAmount),
        notes
      }
    });

    // Emit event for notifications
    eventEmitter.emitEvent(EventType.AGENT_CREATED, {
      agentId: agent.id,
      agentName: agent.fullName,
      city: agent.city,
      createdBy: req.user!.id
    });

    // Log audit
    await logAuditAction({
      adminId: req.user!.id,
      action: 'CREATE_AGENT',
      entity: 'Agent',
      entityId: agent.id.toString(),
      newValue: agent,
      req
    });

    return sendSuccess(res, agent, 'Agent created successfully', 201);
  } catch (error: any) {
    console.error('Create agent error:', error);
    return sendError(res, 'Failed to create agent', 500);
  }
};

// Update agent
export const updateAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      phone,
      whatsapp,
      city,
      country,
      maxDailyAmount,
      notes
    } = req.body;

    // Check if agent exists
    const existingAgent = await prisma.agent.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingAgent) {
      return sendError(res, 'Agent not found', 404);
    }

    // Check if phone is being changed and if it's already taken
    if (phone && phone !== existingAgent.phone) {
      const phoneExists = await prisma.agent.findUnique({
        where: { phone }
      });

      if (phoneExists) {
        return sendError(res, 'Phone number already in use', 400);
      }
    }

    // Update agent
    const agent = await prisma.agent.update({
      where: { id: parseInt(id) },
      data: {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(whatsapp !== undefined && { whatsapp }),
        ...(city && { city }),
        ...(country && { country }),
        ...(maxDailyAmount && { maxDailyAmount: parseFloat(maxDailyAmount) }),
        ...(notes !== undefined && { notes })
      }
    });

    // Log audit
    await logAuditAction({
      adminId: req.user!.id,
      action: 'UPDATE_AGENT',
      entity: 'Agent',
      entityId: agent.id.toString(),
      oldValue: existingAgent,
      newValue: agent,
      req
    });

    return sendSuccess(res, agent, 'Agent updated successfully');
  } catch (error: any) {
    console.error('Update agent error:', error);
    return sendError(res, 'Failed to update agent', 500);
  }
};

// Update agent status
export const updateAgentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'SUSPENDED', 'OUT_OF_CASH', 'ON_HOLD'].includes(status)) {
      return sendError(res, 'Valid status is required', 400);
    }

    const existingAgent = await prisma.agent.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingAgent) {
      return sendError(res, 'Agent not found', 404);
    }

    const agent = await prisma.agent.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    // Log audit
    await logAuditAction({
      adminId: req.user!.id,
      action: 'UPDATE_AGENT_STATUS',
      entity: 'Agent',
      entityId: agent.id.toString(),
      oldValue: { status: existingAgent.status },
      newValue: { status: agent.status },
      req
    });

    return sendSuccess(res, agent, 'Agent status updated successfully');
  } catch (error: any) {
    console.error('Update agent status error:', error);
    return sendError(res, 'Failed to update agent status', 500);
  }
};

// Delete agent (soft delete by setting status to SUSPENDED)
export const deleteAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id: parseInt(id) },
      include: {
        assignedTransactions: {
          where: {
            status: {
              in: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'READY_FOR_PICKUP']
            }
          }
        }
      }
    });

    if (!agent) {
      return sendError(res, 'Agent not found', 404);
    }

    // Check if agent has active transactions
    if (agent.assignedTransactions.length > 0) {
      return sendError(
        res,
        'Cannot delete agent with active transactions. Please reassign or complete them first.',
        400
      );
    }

    // Soft delete by suspending
    const updatedAgent = await prisma.agent.update({
      where: { id: parseInt(id) },
      data: { status: 'SUSPENDED' }
    });

    // Log audit
    await logAuditAction({
      adminId: req.user!.id,
      action: 'DELETE_AGENT',
      entity: 'Agent',
      entityId: agent.id.toString(),
      oldValue: agent,
      req
    });

    return sendSuccess(res, updatedAgent, 'Agent deleted successfully');
  } catch (error: any) {
    console.error('Delete agent error:', error);
    return sendError(res, 'Failed to delete agent', 500);
  }
};

// Get agent transactions
export const getAgentTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.TransactionWhereInput = {
      assignedAgentId: parseInt(id)
    };

    if (status) {
      where.status = status as any;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true
            }
          },
          fromCurrency: true,
          toCurrency: true
        }
      }),
      prisma.transaction.count({ where })
    ]);

    return sendSuccess(res, {
      transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Get agent transactions error:', error);
    return sendError(res, 'Failed to fetch agent transactions', 500);
  }
};

// Get available agents for assignment
export const getAvailableAgents = async (req: AuthRequest, res: Response) => {
  try {
    const { city, amount } = req.query;

    if (!city) {
      return sendError(res, 'City is required', 400);
    }

    const where: Prisma.AgentWhereInput = {
      status: 'ACTIVE',
      city: {
        equals: String(city),
        mode: 'insensitive'
      }
    };

    // If amount is provided, filter by capacity
    if (amount) {
      const amountNum = parseFloat(String(amount));
      where.AND = [
        {
          OR: [
            {
              currentDailyAmount: {
                lte: prisma.agent.fields.maxDailyAmount
              }
            }
          ]
        }
      ];
    }

    const agents = await prisma.agent.findMany({
      where,
      orderBy: [
        { activeTransactions: 'asc' },
        { currentDailyAmount: 'asc' }
      ],
      select: {
        id: true,
        fullName: true,
        phone: true,
        whatsapp: true,
        city: true,
        status: true,
        maxDailyAmount: true,
        currentDailyAmount: true,
        activeTransactions: true,
        totalTransactions: true
      }
    });

    // Filter by capacity if amount provided
    const availableAgents = amount
      ? agents.filter(agent => {
          const remaining = Number(agent.maxDailyAmount) - Number(agent.currentDailyAmount);
          return remaining >= parseFloat(String(amount));
        })
      : agents;

    return sendSuccess(res, availableAgents);
  } catch (error: any) {
    console.error('Get available agents error:', error);
    return sendError(res, 'Failed to fetch available agents', 500);
  }
};

// Create agent login credentials
export const createAgentLogin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;
    const user = req.user;

    const bcrypt = require('bcryptjs');
    const { CredentialGenerator } = require('../utils/credentialGenerator');

    // Check if agent exists
    const agent = await prisma.agent.findUnique({ where: { id: Number(id) } });
    if (!agent) {
      return sendError(res, 'Agent not found', 404);
    }

    // Check if credentials already exist
    const existing = await prisma.$queryRaw`
      SELECT id FROM agent_credentials WHERE agent_id = ${Number(id)}
    `;
    if (existing && existing.length > 0) {
      return sendError(res, 'Agent already has login credentials', 400);
    }

    const generatedUsername = username || await CredentialGenerator.generateAgentUsername(prisma);
    const generatedPassword = password || CredentialGenerator.generatePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    await prisma.$executeRaw`
      INSERT INTO agent_credentials (agent_id, username, password_hash, is_active, created_by)
      VALUES (${Number(id)}, ${generatedUsername}, ${hashedPassword}, true, ${user?.userId})
    `;

    await logAuditAction({
      adminId: user?.userId || 0,
      action: 'CREATE_AGENT_LOGIN',
      entity: 'AgentCredentials',
      entityId: String(id),
      newValue: { username: generatedUsername },
      req
    });

    sendSuccess(res, {
      credentials: { username: generatedUsername, password: generatedPassword }
    }, 'Agent login created successfully');
  } catch (error) {
    console.error('[AgentController] Error creating agent login:', error);
    sendError(res, 'Failed to create agent login');
  }
};

// Reset agent password
export const resetAgentPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user;

    const bcrypt = require('bcryptjs');
    const { CredentialGenerator } = require('../utils/credentialGenerator');

    const newPassword = CredentialGenerator.generatePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$executeRaw`
      UPDATE agent_credentials
      SET password_hash = ${hashedPassword}, updated_at = NOW()
      WHERE agent_id = ${Number(id)}
    `;

    await prisma.$executeRaw`
      INSERT INTO password_reset_history (user_id, reset_by, reason, reset_type)
      VALUES (${Number(id)}, ${user?.userId}, ${reason || 'Agent password reset'}, 'AGENT_RESET')
    `;

    await logAuditAction({
      adminId: user?.userId || 0,
      action: 'RESET_AGENT_PASSWORD',
      entity: 'AgentCredentials',
      entityId: String(id),
      newValue: { reason },
      req
    });

    sendSuccess(res, { newPassword }, 'Agent password reset successfully');
  } catch (error) {
    console.error('[AgentController] Error resetting agent password:', error);
    sendError(res, 'Failed to reset agent password');
  }
};

// Get agent credentials status
export const getAgentCredentials = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const credentials = await prisma.$queryRaw`
      SELECT id, username, is_active, last_login, created_at
      FROM agent_credentials
      WHERE agent_id = ${Number(id)}
    `;

    sendSuccess(res, {
      hasCredentials: credentials && credentials.length > 0,
      credentials: credentials && credentials.length > 0 ? credentials[0] : null
    });
  } catch (error) {
    console.error('[AgentController] Error getting agent credentials:', error);
    sendError(res, 'Failed to retrieve agent credentials');
  }
};
