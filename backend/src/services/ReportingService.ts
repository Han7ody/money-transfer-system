import prisma from '../lib/prisma';

export enum ReportType {
  DAILY_SUMMARY = 'DAILY_SUMMARY',
  KYC_COMPLIANCE = 'KYC_COMPLIANCE',
  FRAUD_DETECTION = 'FRAUD_DETECTION',
  AML_ALERTS = 'AML_ALERTS',
  TRANSACTION_RISK = 'TRANSACTION_RISK'
}

// Helper function to convert BigInt to Number recursively
function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToNumber(item));
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertBigIntToNumber(obj[key]);
    }
    return converted;
  }
  
  return obj;
}

export class ReportingService {
  /**
   * Generate daily transaction summary report
   */
  async generateDailySummary(dateFrom: Date, dateTo: Date, generatedBy: number): Promise<any> {
    try {
      const transactions = await prisma.$queryRaw<any[]>`
        SELECT 
          status,
          COUNT(*) as count,
          SUM(amount_sent) as total_amount,
          AVG(amount_sent) as avg_amount
        FROM transactions
        WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo}
        GROUP BY status
      `;

      const highRiskTransactions = await prisma.$queryRaw<any[]>`
        SELECT 
          t.id,
          t.transaction_ref,
          t.amount_sent,
          t.status,
          u.full_name,
          u.fraud_score,
          u.risk_level
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        WHERE t.created_at >= ${dateFrom} 
        AND t.created_at <= ${dateTo}
        AND (u.fraud_score >= 70 OR t.amount_sent > 5000)
        ORDER BY u.fraud_score DESC, t.amount_sent DESC
        LIMIT 50
      `;

      const reportData = {
        period: { from: dateFrom, to: dateTo },
        summary: transactions,
        highRiskTransactions,
        generatedAt: new Date()
      };

      await this.saveReport({
        reportType: ReportType.DAILY_SUMMARY,
        reportName: `Daily Transaction Summary ${dateFrom.toISOString().split('T')[0]}`,
        dateFrom,
        dateTo,
        generatedBy,
        reportData
      });

      return reportData;
    } catch (error) {
      console.error('[Reporting] Error generating daily summary:', error);
      throw error;
    }
  }

  /**
   * Generate KYC compliance report
   */
  async generateKYCComplianceReport(dateFrom: Date, dateTo: Date, generatedBy: number): Promise<any> {
    try {
      const kycStats = await prisma.$queryRaw<any[]>`
        SELECT 
          kyc_status,
          COUNT(*) as count
        FROM users
        WHERE kyc_submitted_at >= ${dateFrom} AND kyc_submitted_at <= ${dateTo}
        GROUP BY kyc_status
      `;

      const avgReviewTime = await prisma.$queryRaw<any[]>`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (kyc_reviewed_at - kyc_submitted_at))/3600) as avg_hours
        FROM users
        WHERE kyc_reviewed_at IS NOT NULL
        AND kyc_submitted_at >= ${dateFrom} 
        AND kyc_submitted_at <= ${dateTo}
      `;

      const pendingVerifications = await prisma.$queryRaw<any[]>`
        SELECT 
          u.id,
          u.full_name,
          u.email,
          u.kyc_status,
          u.kyc_submitted_at,
          u.fraud_score,
          EXTRACT(EPOCH FROM (NOW() - u.kyc_submitted_at))/3600 as hours_pending
        FROM users u
        WHERE u.kyc_status = 'PENDING'
        AND u.kyc_submitted_at >= ${dateFrom}
        ORDER BY u.kyc_submitted_at ASC
        LIMIT 100
      `;

      const reportData = {
        period: { from: dateFrom, to: dateTo },
        statistics: kycStats,
        averageReviewTime: avgReviewTime[0]?.avg_hours || 0,
        pendingVerifications,
        generatedAt: new Date()
      };

      await this.saveReport({
        reportType: ReportType.KYC_COMPLIANCE,
        reportName: `KYC Compliance Report ${dateFrom.toISOString().split('T')[0]}`,
        dateFrom,
        dateTo,
        generatedBy,
        reportData
      });

      return reportData;
    } catch (error) {
      console.error('[Reporting] Error generating KYC report:', error);
      throw error;
    }
  }

  /**
   * Generate fraud detection report
   */
  async generateFraudDetectionReport(dateFrom: Date, dateTo: Date, generatedBy: number): Promise<any> {
    try {
      const fraudMatches = await prisma.$queryRaw<any[]>`
        SELECT 
          match_type,
          COUNT(*) as count,
          SUM(score) as total_score
        FROM fraud_matches
        WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo}
        GROUP BY match_type
      `;

      const highRiskUsers = await prisma.$queryRaw<any[]>`
        SELECT 
          u.id,
          u.full_name,
          u.email,
          u.fraud_score,
          u.risk_level,
          u.kyc_status,
          COUNT(fm.id) as match_count
        FROM users u
        LEFT JOIN fraud_matches fm ON u.id = fm.user_id AND fm.is_resolved = false
        WHERE u.fraud_score >= 70
        GROUP BY u.id, u.full_name, u.email, u.fraud_score, u.risk_level, u.kyc_status
        ORDER BY u.fraud_score DESC
        LIMIT 50
      `;

      const resolvedMatches = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count
        FROM fraud_matches
        WHERE is_resolved = true
        AND resolved_at >= ${dateFrom} AND resolved_at <= ${dateTo}
      `;

      const reportData = {
        period: { from: dateFrom, to: dateTo },
        matchesByType: fraudMatches,
        highRiskUsers,
        resolvedMatches: resolvedMatches[0]?.count || 0,
        generatedAt: new Date()
      };

      await this.saveReport({
        reportType: ReportType.FRAUD_DETECTION,
        reportName: `Fraud Detection Report ${dateFrom.toISOString().split('T')[0]}`,
        dateFrom,
        dateTo,
        generatedBy,
        reportData
      });

      return reportData;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[Reporting] Fraud tables not found - returning empty report');
        return {
          period: { from: dateFrom, to: dateTo },
          matchesByType: [],
          highRiskUsers: [],
          resolvedMatches: 0,
          generatedAt: new Date()
        };
      }
      throw error;
    }
  }

  /**
   * Generate AML alerts report
   */
  async generateAMLAlertsReport(dateFrom: Date, dateTo: Date, generatedBy: number): Promise<any> {
    try {
      const alertsByType = await prisma.$queryRaw<any[]>`
        SELECT 
          type,
          severity,
          COUNT(*) as count
        FROM aml_alerts
        WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo}
        GROUP BY type, severity
        ORDER BY severity DESC, type
      `;

      const alertsByStatus = await prisma.$queryRaw<any[]>`
        SELECT 
          status,
          COUNT(*) as count
        FROM aml_alerts
        WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo}
        GROUP BY status
      `;

      const openAlerts = await prisma.$queryRaw<any[]>`
        SELECT 
          a.id,
          a.type,
          a.severity,
          a.message,
          a.created_at,
          u.full_name,
          u.email,
          t.transaction_ref
        FROM aml_alerts a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN transactions t ON a.transaction_id = t.id
        WHERE a.status = 'OPEN'
        AND a.created_at >= ${dateFrom}
        ORDER BY a.severity DESC, a.created_at DESC
        LIMIT 100
      `;

      const reportData = {
        period: { from: dateFrom, to: dateTo },
        alertsByType,
        alertsByStatus,
        openAlerts,
        generatedAt: new Date()
      };

      await this.saveReport({
        reportType: ReportType.AML_ALERTS,
        reportName: `AML Alerts Report ${dateFrom.toISOString().split('T')[0]}`,
        dateFrom,
        dateTo,
        generatedBy,
        reportData
      });

      return reportData;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[Reporting] AML tables not found - returning empty report');
        return {
          period: { from: dateFrom, to: dateTo },
          alertsByType: [],
          alertsByStatus: [],
          openAlerts: [],
          generatedAt: new Date()
        };
      }
      throw error;
    }
  }

  /**
   * Get saved reports
   */
  async getReports(filters: {
    reportType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ reports: any[]; total: number }> {
    try {
      const { reportType, page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (reportType) {
        whereClause += ` AND report_type = $${paramIndex}`;
        params.push(reportType);
        paramIndex++;
      }

      const reports = await prisma.$queryRawUnsafe(`
        SELECT 
          r.*,
          u.full_name as generated_by_name
        FROM compliance_reports r
        LEFT JOIN users u ON r.generated_by = u.id
        ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, ...params, limit, offset);

      const totalResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM compliance_reports ${whereClause}`,
        ...params
      );

      return {
        reports: reports as any[],
        total: Number(totalResult[0]?.count || 0)
      };
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        return { reports: [], total: 0 };
      }
      throw error;
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: number): Promise<any> {
    try {
      const reports = await prisma.$queryRaw<any[]>`
        SELECT 
          r.*,
          u.full_name as generated_by_name
        FROM compliance_reports r
        LEFT JOIN users u ON r.generated_by = u.id
        WHERE r.id = ${reportId}
      `;

      if (reports.length === 0) {
        throw new Error('Report not found');
      }

      return reports[0];
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        throw new Error('Compliance reports table not found');
      }
      throw error;
    }
  }

  /**
   * Export report to CSV format
   */
  exportToCSV(reportData: any): string {
    const lines: string[] = [];
    
    // Handle different report types
    if (reportData.summary) {
      // Daily Transaction Summary
      lines.push('Status,Count,Total Amount,Average Amount');
      reportData.summary.forEach((row: any) => {
        lines.push(`${row.status},${row.count},${row.total_amount || 0},${row.avg_amount || 0}`);
      });
    } else if (reportData.statistics) {
      // KYC Compliance Report
      lines.push('KYC Status,Count');
      reportData.statistics.forEach((row: any) => {
        lines.push(`${row.kyc_status},${row.count}`);
      });
      
      if (reportData.averageReviewTime) {
        lines.push('');
        lines.push(`Average Review Time (hours),${reportData.averageReviewTime}`);
      }
    } else if (reportData.matchesByType) {
      // Fraud Detection Report
      lines.push('Match Type,Count,Total Score');
      reportData.matchesByType.forEach((row: any) => {
        lines.push(`${row.match_type},${row.count},${row.total_score || 0}`);
      });
      
      if (reportData.resolvedMatches) {
        lines.push('');
        lines.push(`Resolved Matches,${reportData.resolvedMatches}`);
      }
    } else if (reportData.alertsByType) {
      // AML Alerts Report
      lines.push('Type,Severity,Count');
      reportData.alertsByType.forEach((row: any) => {
        lines.push(`${row.type},${row.severity},${row.count}`);
      });
    }

    return lines.join('\n');
  }

  // Private helper methods

  private async saveReport(params: {
    reportType: ReportType;
    reportName: string;
    dateFrom: Date;
    dateTo: Date;
    generatedBy: number;
    reportData: any;
  }): Promise<void> {
    try {
      // Convert BigInt to Number before JSON serialization
      const cleanedData = convertBigIntToNumber(params.reportData);
      
      await prisma.$executeRaw`
        INSERT INTO compliance_reports (
          report_type, report_name, date_from, date_to, 
          generated_by, report_data, created_at
        )
        VALUES (
          ${params.reportType},
          ${params.reportName},
          ${params.dateFrom},
          ${params.dateTo},
          ${params.generatedBy},
          ${JSON.stringify(cleanedData)}::jsonb,
          NOW()
        )
      `;
    } catch (error: any) {
      if (error.code === 'P2010' || error.message?.includes('does not exist')) {
        console.warn('[Reporting] compliance_reports table not found - skipping save');
        return;
      }
      console.error('[Reporting] Error saving report:', error);
    }
  }
}

export const reportingService = new ReportingService();
