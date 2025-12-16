import prisma from '../lib/prisma';

export enum CaseType {
  VELOCITY = 'VELOCITY',
  STRUCTURING = 'STRUCTURING',
  HIGH_RISK = 'HIGH_RISK',
  SUSPICIOUS = 'SUSPICIOUS',
  FRAUD = 'FRAUD'
}

export enum CaseStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED'
}

export enum CaseSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export class AMLCaseService {
  /**
   * Create a new AML case
   */
  async createCase(params: {
    userId: number;
    transactionId?: number;
    caseType: CaseType;
    severity: CaseSeverity;
    title: string;
    description?: string;
    createdBy: number;
    alertIds?: number[];
  }): Promise<any> {
    try {
      // Generate case number
      const caseNumber = await this.generateCaseNumber();

      // Create case
      const caseResult = await prisma.$queryRaw`
        INSERT INTO aml_cases (
          case_number, user_id, transaction_id, case_type, severity, 
          status, title, description, created_by, created_at, updated_at
        )
        VALUES (
          ${caseNumber},
          ${params.userId},
          ${params.transactionId || null},
          ${params.caseType},
          ${params.severity},
          'OPEN',
          ${params.title},
          ${params.description || null},
          ${params.createdBy},
          NOW(),
          NOW()
        )
        RETURNING *
      `;

      const amlCase = (caseResult as any[])[0];

      // Link alerts to case if provided
      if (params.alertIds && params.alertIds.length > 0) {
        for (const alertId of params.alertIds) {
          await this.linkAlertToCase(alertId, amlCase.id);
        }
      }

      // Log activity
      await this.logActivity({
        caseId: amlCase.id,
        adminId: params.createdBy,
        activityType: 'CREATED',
        notes: `Case created: ${params.title}`
      });

      return amlCase;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        throw new Error('AML case management tables not found. Please run Sprint 3 Enhanced migration.');
      }
      throw error;
    }
  }

  /**
   * Create case from AML alert
   */
  async createCaseFromAlert(alertId: number, createdBy: number): Promise<any> {
    try {
      // Get alert details
      const alerts = await prisma.$queryRaw<any[]>`
        SELECT a.*, u.full_name as user_name, t.transaction_ref
        FROM aml_alerts a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN transactions t ON a.transaction_id = t.id
        WHERE a.id = ${alertId}
      `;

      if (alerts.length === 0) {
        throw new Error('Alert not found');
      }

      const alert = alerts[0];

      // Create case
      const amlCase = await this.createCase({
        userId: alert.user_id,
        transactionId: alert.transaction_id,
        caseType: alert.type as CaseType,
        severity: alert.severity as CaseSeverity,
        title: `${alert.type} Alert - ${alert.user_name}`,
        description: alert.message,
        createdBy,
        alertIds: [alertId]
      });

      return amlCase;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        throw new Error('AML tables not found. Please run Sprint 3 Enhanced migration.');
      }
      throw error;
    }
  }

  /**
   * Get case details
   */
  async getCaseDetails(caseId: number): Promise<any> {
    try {
      const cases = await prisma.$queryRaw<any[]>`
        SELECT 
          c.*,
          u.full_name as user_name,
          u.email as user_email,
          u.phone as user_phone,
          u.kyc_status,
          u.fraud_score,
          u.risk_level,
          t.transaction_ref,
          t.amount_sent,
          creator.full_name as created_by_name,
          assignee.full_name as assigned_to_name,
          resolver.full_name as resolved_by_name
        FROM aml_cases c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN transactions t ON c.transaction_id = t.id
        LEFT JOIN users creator ON c.created_by = creator.id
        LEFT JOIN users assignee ON c.assigned_to = assignee.id
        LEFT JOIN users resolver ON c.resolved_by = resolver.id
        WHERE c.id = ${caseId}
      `;

      if (cases.length === 0) {
        throw new Error('Case not found');
      }

      const amlCase = cases[0];

      // Get linked alerts
      const alerts = await prisma.$queryRaw<any[]>`
        SELECT * FROM aml_alerts
        WHERE case_id = ${caseId}
        ORDER BY created_at DESC
      `;

      // Get activities
      const activities = await prisma.$queryRaw<any[]>`
        SELECT a.*, u.full_name as admin_name
        FROM aml_case_activities a
        LEFT JOIN users u ON a.admin_id = u.id
        WHERE a.case_id = ${caseId}
        ORDER BY a.created_at DESC
      `;

      return {
        ...amlCase,
        alerts,
        activities
      };
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        throw new Error('AML case tables not found. Please run Sprint 3 Enhanced migration.');
      }
      throw error;
    }
  }

  /**
   * Get all cases with filtering
   */
  async getCases(filters: {
    status?: string;
    severity?: string;
    caseType?: string;
    assignedTo?: number;
    page?: number;
    limit?: number;
  }): Promise<{ cases: any[]; total: number }> {
    try {
      const { status, severity, caseType, assignedTo, page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        whereClause += ` AND c.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (severity) {
        whereClause += ` AND c.severity = $${paramIndex}`;
        params.push(severity);
        paramIndex++;
      }

      if (caseType) {
        whereClause += ` AND c.case_type = $${paramIndex}`;
        params.push(caseType);
        paramIndex++;
      }

      if (assignedTo) {
        whereClause += ` AND c.assigned_to = $${paramIndex}`;
        params.push(assignedTo);
        paramIndex++;
      }

      const cases = await prisma.$queryRawUnsafe(`
        SELECT 
          c.*,
          u.full_name as user_name,
          u.email as user_email,
          assignee.full_name as assigned_to_name
        FROM aml_cases c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users assignee ON c.assigned_to = assignee.id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, ...params, limit, offset);

      const totalResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM aml_cases c ${whereClause}`,
        ...params
      );

      return {
        cases: cases as any[],
        total: Number(totalResult[0]?.count || 0)
      };
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        return { cases: [], total: 0 };
      }
      throw error;
    }
  }

  /**
   * Assign case to compliance officer
   */
  async assignCase(caseId: number, assignedTo: number, assignedBy: number): Promise<void> {
    try {
      await prisma.$executeRaw`
        UPDATE aml_cases
        SET assigned_to = ${assignedTo}, assigned_at = NOW(), updated_at = NOW()
        WHERE id = ${caseId}
      `;

      await this.logActivity({
        caseId,
        adminId: assignedBy,
        activityType: 'ASSIGNED',
        newValue: assignedTo.toString(),
        notes: 'Case assigned to compliance officer'
      });
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        throw new Error('AML case tables not found');
      }
      throw error;
    }
  }

  /**
   * Update case status
   */
  async updateStatus(caseId: number, newStatus: CaseStatus, adminId: number, notes?: string): Promise<void> {
    try {
      // Get current status
      const cases = await prisma.$queryRaw<any[]>`
        SELECT status FROM aml_cases WHERE id = ${caseId}
      `;

      const oldStatus = cases[0]?.status;

      // Update status
      await prisma.$executeRaw`
        UPDATE aml_cases
        SET status = ${newStatus}, updated_at = NOW()
        WHERE id = ${caseId}
      `;

      // Log activity
      await this.logActivity({
        caseId,
        adminId,
        activityType: 'STATUS_CHANGED',
        oldValue: oldStatus,
        newValue: newStatus,
        notes
      });
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        throw new Error('AML case tables not found');
      }
      throw error;
    }
  }

  /**
   * Resolve case
   */
  async resolveCase(caseId: number, resolvedBy: number, resolutionNotes: string): Promise<void> {
    try {
      await prisma.$executeRaw`
        UPDATE aml_cases
        SET 
          status = 'RESOLVED',
          resolved_by = ${resolvedBy},
          resolved_at = NOW(),
          resolution_notes = ${resolutionNotes},
          updated_at = NOW()
        WHERE id = ${caseId}
      `;

      await this.logActivity({
        caseId,
        adminId: resolvedBy,
        activityType: 'RESOLVED',
        notes: resolutionNotes
      });
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        throw new Error('AML case tables not found');
      }
      throw error;
    }
  }

  /**
   * Add note to case
   */
  async addNote(caseId: number, adminId: number, notes: string): Promise<void> {
    await this.logActivity({
      caseId,
      adminId,
      activityType: 'NOTE_ADDED',
      notes
    });
  }

  /**
   * Get case statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const stats = await prisma.$queryRaw<any[]>`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'OPEN') as open_cases,
          COUNT(*) FILTER (WHERE status = 'INVESTIGATING') as investigating_cases,
          COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved_cases,
          COUNT(*) FILTER (WHERE status = 'ESCALATED') as escalated_cases,
          COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_cases,
          COUNT(*) FILTER (WHERE severity = 'HIGH') as high_cases,
          COUNT(*) as total_cases
        FROM aml_cases
      `;

      const result = stats[0] || {
        open_cases: 0,
        investigating_cases: 0,
        resolved_cases: 0,
        escalated_cases: 0,
        critical_cases: 0,
        high_cases: 0,
        total_cases: 0
      };

      // Convert BigInt to Number for JSON serialization
      return {
        open_cases: Number(result.open_cases || 0),
        investigating_cases: Number(result.investigating_cases || 0),
        resolved_cases: Number(result.resolved_cases || 0),
        escalated_cases: Number(result.escalated_cases || 0),
        critical_cases: Number(result.critical_cases || 0),
        high_cases: Number(result.high_cases || 0),
        total_cases: Number(result.total_cases || 0)
      };
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        return {
          open_cases: 0,
          investigating_cases: 0,
          resolved_cases: 0,
          escalated_cases: 0,
          critical_cases: 0,
          high_cases: 0,
          total_cases: 0
        };
      }
      throw error;
    }
  }

  // Private helper methods

  private async generateCaseNumber(): Promise<string> {
    try {
      const result = await prisma.$queryRaw<any[]>`SELECT generate_case_number() as case_number`;
      return result[0].case_number;
    } catch (error) {
      // Fallback if function doesn't exist
      const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `AML-${yearMonth}-${random}`;
    }
  }

  private async linkAlertToCase(alertId: number, caseId: number): Promise<void> {
    try {
      await prisma.$executeRaw`
        UPDATE aml_alerts
        SET case_id = ${caseId}
        WHERE id = ${alertId}
      `;
    } catch (error) {
      console.warn('[AMLCase] Could not link alert to case:', error);
    }
  }

  private async logActivity(params: {
    caseId: number;
    adminId: number;
    activityType: string;
    oldValue?: string;
    newValue?: string;
    notes?: string;
  }): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO aml_case_activities (case_id, admin_id, activity_type, old_value, new_value, notes, created_at)
        VALUES (
          ${params.caseId},
          ${params.adminId},
          ${params.activityType},
          ${params.oldValue || null},
          ${params.newValue || null},
          ${params.notes || null},
          NOW()
        )
      `;
    } catch (error) {
      console.error('[AMLCase] Error logging activity:', error);
    }
  }
}

export const amlCaseService = new AMLCaseService();
