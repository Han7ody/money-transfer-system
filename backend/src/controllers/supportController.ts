import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { logAdminAction } from '../utils/auditLogger';

const prisma = new PrismaClient();

export class SupportController {
  /**
   * Log WhatsApp escalation
   */
  async logEscalation(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId, reason, priority } = req.body;
      const user = (req as any).user;

      if (!entityType || !entityId || !reason) {
        return sendError(res, 'Missing required fields', 400);
      }

      await logAdminAction({
        adminId: user.userId,
        action: 'WHATSAPP_ESCALATION',
        entity: entityType,
        entityId: String(entityId),
        newValue: {
          reason,
          priority,
          escalatedBy: user.email
        },
        req
      });

      sendSuccess(res, {
        message: 'Escalation logged successfully',
        escalation: {
          entityType,
          entityId,
          reason,
          priority,
          escalatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('[SupportController] Error logging escalation:', error);
      sendError(res, 'Failed to log escalation');
    }
  }

  /**
   * Get escalation history
   */
  async getEscalations(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.query;

      const where: any = {
        action: 'WHATSAPP_ESCALATION'
      };

      if (entityType) {
        where.entity = entityType;
      }

      if (entityId) {
        where.entityId = String(entityId);
      }

      const escalations = await prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      sendSuccess(res, { escalations });
    } catch (error) {
      console.error('[SupportController] Error getting escalations:', error);
      sendError(res, 'Failed to retrieve escalations');
    }
  }

  /**
   * Create support request
   */
  async createSupportRequest(req: Request, res: Response): Promise<void> {
    try {
      const { userId, customerPhone, customerName, issueCategory, issueDescription, priority } = req.body;

      if (!customerPhone || !issueCategory) {
        return sendError(res, 'Customer phone and issue category are required', 400);
      }

      const supportRequest = await prisma.$queryRaw`
        INSERT INTO support_requests (
          user_id, customer_phone, customer_name, issue_category, 
          issue_description, priority, status
        )
        VALUES (
          ${userId || null},
          ${customerPhone},
          ${customerName || null},
          ${issueCategory},
          ${issueDescription || null},
          ${priority || 'MEDIUM'},
          'OPEN'
        )
        RETURNING *
      `;

      sendSuccess(res, { supportRequest: supportRequest[0] }, 'Support request created successfully');
    } catch (error) {
      console.error('[SupportController] Error creating support request:', error);
      sendError(res, 'Failed to create support request');
    }
  }

  /**
   * Get all support requests with filters
   */
  async getSupportRequests(req: Request, res: Response): Promise<void> {
    try {
      const { status, category, assignedTo, page = 1, limit = 20 } = req.query;
      
      const offset = (Number(page) - 1) * Number(limit);
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        conditions.push(`status = $${paramIndex++}`);
        params.push(status);
      }

      if (category) {
        conditions.push(`issue_category = $${paramIndex++}`);
        params.push(category);
      }

      if (assignedTo) {
        conditions.push(`assigned_admin_id = $${paramIndex++}`);
        params.push(Number(assignedTo));
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const requests = await prisma.$queryRawUnsafe(`
        SELECT 
          sr.*,
          u.full_name as customer_full_name,
          u.email as customer_email,
          a.full_name as assigned_admin_name,
          (SELECT COUNT(*) FROM support_notes WHERE support_request_id = sr.id) as notes_count
        FROM support_requests sr
        LEFT JOIN users u ON sr.user_id = u.id
        LEFT JOIN users a ON sr.assigned_admin_id = a.id
        ${whereClause}
        ORDER BY 
          CASE WHEN sr.status = 'ESCALATED' THEN 0 ELSE 1 END,
          sr.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, ...params, Number(limit), offset);

      const totalResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM support_requests sr ${whereClause}`,
        ...params
      );

      sendSuccess(res, {
        requests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(totalResult[0]?.count || 0)
        }
      });
    } catch (error) {
      console.error('[SupportController] Error getting support requests:', error);
      sendError(res, 'Failed to retrieve support requests');
    }
  }

  /**
   * Get support request by ID
   */
  async getSupportRequestById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const request = await prisma.$queryRaw`
        SELECT 
          sr.*,
          u.full_name as customer_full_name,
          u.email as customer_email,
          a.full_name as assigned_admin_name,
          a.email as assigned_admin_email
        FROM support_requests sr
        LEFT JOIN users u ON sr.user_id = u.id
        LEFT JOIN users a ON sr.assigned_admin_id = a.id
        WHERE sr.id = ${Number(id)}
      `;

      if (!request || request.length === 0) {
        return sendError(res, 'Support request not found', 404);
      }

      const notes = await prisma.$queryRaw`
        SELECT 
          sn.*,
          u.full_name as admin_name,
          u.email as admin_email
        FROM support_notes sn
        LEFT JOIN users u ON sn.admin_id = u.id
        WHERE sn.support_request_id = ${Number(id)}
        ORDER BY sn.created_at DESC
      `;

      sendSuccess(res, {
        request: request[0],
        notes
      });
    } catch (error) {
      console.error('[SupportController] Error getting support request:', error);
      sendError(res, 'Failed to retrieve support request');
    }
  }

  /**
   * Update support request status
   */
  async updateSupportStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, note } = req.body;
      const user = (req as any).user;

      if (!status || !['OPEN', 'RESOLVED', 'ESCALATED'].includes(status)) {
        return sendError(res, 'Invalid status', 400);
      }

      if (status === 'ESCALATED' && !note) {
        return sendError(res, 'Note is required when escalating', 400);
      }

      await prisma.$executeRaw`
        UPDATE support_requests
        SET status = ${status}
        WHERE id = ${Number(id)}
      `;

      if (note) {
        await prisma.$executeRaw`
          INSERT INTO support_notes (support_request_id, admin_id, note_text, is_internal)
          VALUES (${Number(id)}, ${user.userId}, ${note}, true)
        `;
      }

      await logAdminAction({
        adminId: user.userId,
        action: 'UPDATE_SUPPORT_STATUS',
        entity: 'SupportRequest',
        entityId: id,
        newValue: { status, note },
        req
      });

      sendSuccess(res, null, 'Support request status updated successfully');
    } catch (error) {
      console.error('[SupportController] Error updating support status:', error);
      sendError(res, 'Failed to update support status');
    }
  }

  /**
   * Add note to support request
   */
  async addSupportNote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { noteText, isInternal = true } = req.body;
      const user = (req as any).user;

      if (!noteText) {
        return sendError(res, 'Note text is required', 400);
      }

      const note = await prisma.$queryRaw`
        INSERT INTO support_notes (support_request_id, admin_id, note_text, is_internal)
        VALUES (${Number(id)}, ${user.userId}, ${noteText}, ${isInternal})
        RETURNING *
      `;

      sendSuccess(res, { note: note[0] }, 'Note added successfully');
    } catch (error) {
      console.error('[SupportController] Error adding note:', error);
      sendError(res, 'Failed to add note');
    }
  }

  /**
   * Assign support request to admin
   */
  async assignSupport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { adminId } = req.body;
      const user = (req as any).user;

      if (!adminId) {
        return sendError(res, 'Admin ID is required', 400);
      }

      await prisma.$executeRaw`
        UPDATE support_requests
        SET assigned_admin_id = ${Number(adminId)}
        WHERE id = ${Number(id)}
      `;

      await logAdminAction({
        adminId: user.userId,
        action: 'ASSIGN_SUPPORT',
        entity: 'SupportRequest',
        entityId: id,
        newValue: { assignedTo: adminId },
        req
      });

      sendSuccess(res, null, 'Support request assigned successfully');
    } catch (error) {
      console.error('[SupportController] Error assigning support:', error);
      sendError(res, 'Failed to assign support request');
    }
  }
}

export default new SupportController();
