import { Request, Response } from 'express';
import AgentService from '../services/AgentService';
import { sendSuccess, sendError } from '../utils/response';

export class AgentManagementController {
  /**
   * Create agent
   */
  async createAgent(req: Request, res: Response) {
    try {
      const { fullName, phone, whatsapp, city, country, maxDailyAmount, notes, username, password } = req.body;
      const createdBy = (req as any).user?.adminId || (req as any).user?.userId;

      if (!fullName || !phone || !city || !maxDailyAmount) {
        return sendError(res, 'Full name, phone, city, and max daily amount are required', 400);
      }

      const result = await AgentService.createAgent({
        fullName,
        phone,
        whatsapp,
        city,
        country,
        maxDailyAmount: Number(maxDailyAmount),
        notes,
        username,
        password,
        createdBy
      });

      sendSuccess(res, result, 'Agent created successfully', 201);
    } catch (error: any) {
      console.error('[AgentManagementController] Create error:', error);
      sendError(res, error.message || 'Failed to create agent');
    }
  }

  /**
   * List agents
   */
  async listAgents(req: Request, res: Response) {
    try {
      const { city, status, search, page, limit } = req.query;

      const result = await AgentService.listAgents({
        city: city as string,
        status: status as string,
        search: search as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20
      });

      sendSuccess(res, result);
    } catch (error: any) {
      console.error('[AgentManagementController] List error:', error);
      sendError(res, error.message || 'Failed to list agents');
    }
  }

  /**
   * Get agent by ID
   */
  async getAgent(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const agent = await AgentService.getAgentProfile(Number(id));

      sendSuccess(res, { agent });
    } catch (error: any) {
      console.error('[AgentManagementController] Get error:', error);
      sendError(res, error.message || 'Failed to get agent');
    }
  }

  /**
   * Update agent
   */
  async updateAgent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { fullName, phone, whatsapp, city, maxDailyAmount, notes, performanceScore } = req.body;
      const updatedBy = (req as any).user?.adminId || (req as any).user?.userId;

      await AgentService.updateAgent(
        Number(id),
        {
          fullName,
          phone,
          whatsapp,
          city,
          maxDailyAmount: maxDailyAmount ? Number(maxDailyAmount) : undefined,
          notes,
          performanceScore: performanceScore ? Number(performanceScore) : undefined
        },
        updatedBy
      );

      sendSuccess(res, null, 'Agent updated successfully');
    } catch (error: any) {
      console.error('[AgentManagementController] Update error:', error);
      sendError(res, error.message || 'Failed to update agent');
    }
  }

  /**
   * Suspend agent
   */
  async suspendAgent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const suspendedBy = (req as any).user?.adminId || (req as any).user?.userId;

      await AgentService.suspendAgent(Number(id), reason || 'No reason provided', suspendedBy);

      sendSuccess(res, null, 'Agent suspended successfully');
    } catch (error: any) {
      console.error('[AgentManagementController] Suspend error:', error);
      sendError(res, error.message || 'Failed to suspend agent');
    }
  }

  /**
   * Activate agent
   */
  async activateAgent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const activatedBy = (req as any).user?.adminId || (req as any).user?.userId;

      await AgentService.activateAgent(Number(id), activatedBy);

      sendSuccess(res, null, 'Agent activated successfully');
    } catch (error: any) {
      console.error('[AgentManagementController] Activate error:', error);
      sendError(res, error.message || 'Failed to activate agent');
    }
  }

  /**
   * Reset agent access
   */
  async resetAccess(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const resetBy = (req as any).user?.adminId || (req as any).user?.userId;

      const newPassword = await AgentService.resetAgentAccess(
        Number(id),
        reason || 'Admin reset',
        resetBy
      );

      sendSuccess(res, { newPassword }, 'Agent access reset successfully');
    } catch (error: any) {
      console.error('[AgentManagementController] Reset access error:', error);
      sendError(res, error.message || 'Failed to reset agent access');
    }
  }

  /**
   * Update performance score
   */
  async updatePerformanceScore(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { score } = req.body;
      const updatedBy = (req as any).user?.adminId || (req as any).user?.userId;

      if (score === undefined || score === null) {
        return sendError(res, 'Performance score is required', 400);
      }

      await AgentService.updatePerformanceScore(Number(id), Number(score), updatedBy);

      sendSuccess(res, null, 'Performance score updated successfully');
    } catch (error: any) {
      console.error('[AgentManagementController] Update performance error:', error);
      sendError(res, error.message || 'Failed to update performance score');
    }
  }
}

export default new AgentManagementController();
