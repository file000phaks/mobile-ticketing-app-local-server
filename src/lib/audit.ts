// Audit service for maintaining immutable logs and compliance
// Implements GDPR-compliant logging with data protection features

interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  metadata: {
    version: string;
    source: 'web' | 'mobile' | 'api';
    environment: 'development' | 'staging' | 'production';
  };
  // Immutability fields
  hash: string;
  previousHash?: string;
}

interface AuditQuery {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

class AuditService {
  private readonly STORAGE_KEY = 'audit_logs';
  private readonly MAX_LOCAL_LOGS = 1000;
  private logs: AuditEvent[] = [];
  private initialized = false;

  // Initialize the audit service
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.loadLogs();
      this.initialized = true;
      console.log('Audit service initialized');
    } catch (error) {
      console.error('Failed to initialize audit service:', error);
    }
  }

  // Load logs from storage
  private async loadLogs(): Promise<void> {
   
    try {
   
      const stored = localStorage.getItem(this.STORAGE_KEY);
   
      if (stored) {
        const parsedLogs = JSON.parse(stored);
        this.logs = parsedLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
   
    } catch (error) {
   
      console.error('Error loading audit logs:', error);
   
      this.logs = [];
   
    }
  
  }

  // Save logs to storage
  private async saveLogs(): Promise<void> {
  
    try {
  
      // Keep only the most recent logs locally
      const logsToSave = this.logs.slice(-this.MAX_LOCAL_LOGS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logsToSave));
  
    } catch (error) {
  
      console.error('Error saving audit logs:', error);
  
    }
  
  }

  // Generate hash for log entry integrity
  private async generateHash(event: Omit<AuditEvent, 'hash' | 'previousHash'>): Promise<string> {
  
    const data = JSON.stringify(event);
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  }

  // Log an audit event
  async logEvent(
  
    action: string,
    resource: string,
    details: Record<string, any> = {},
    resourceId?: string,
    userId?: string,
    userEmail?: string
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const previousHash = this.logs.length > 0 ? this.logs[this.logs.length - 1].hash : undefined;
      
      const event: Omit<AuditEvent, 'hash' | 'previousHash'> = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        userId,
        userEmail,
        action,
        resource,
        resourceId,
        details: this.sanitizeDetails(details),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId(),
        metadata: {
          version: '1.0.0',
          source: 'web',
          environment: this.getEnvironment()
        }
      };

      const hash = await this.generateHash(event);
      
      const auditEvent: AuditEvent = {
        ...event,
        hash,
        previousHash
      };

      this.logs.push(auditEvent);
      await this.saveLogs();

      // In production, send to secure audit service
      if (this.getEnvironment() === 'production') {
        await this.sendToAuditService(auditEvent);
      }

      console.log(`Audit: ${action} on ${resource}`, details);
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  // Sanitize sensitive data from details
  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'credential'];
    const sanitized = { ...details };

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    return sanitizeObject(sanitized);
  }

  // Get client IP (approximation)
  private async getClientIP(): Promise<string> {
    try {
      // In a real app, this would be provided by the server
      return 'client-ip-hidden';
    } catch {
      return 'unknown';
    }
  }

  // Get session ID from storage or generate one
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  // Get environment
  private getEnvironment(): 'development' | 'staging' | 'production' {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'development';
    if (hostname.includes('staging')) return 'staging';
    return 'production';
  }

  // Send to secure audit service (mock implementation)
  private async sendToAuditService(event: AuditEvent): Promise<void> {
    try {
      // In production, this would send to a secure audit logging service
      // like AWS CloudTrail, Azure Monitor, or a dedicated SIEM
      console.log('Sending audit event to secure service:', event.id);
    } catch (error) {
      console.error('Failed to send audit event to service:', error);
    }
  }

  // Query audit logs
  async queryLogs(query: AuditQuery = {}): Promise<AuditEvent[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    let filtered = [...this.logs];

    // Apply filters
    if (query.userId) {
      filtered = filtered.filter(log => log.userId === query.userId);
    }

    if (query.action) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(query.action!.toLowerCase())
      );
    }

    if (query.resource) {
      filtered = filtered.filter(log => 
        log.resource.toLowerCase().includes(query.resource!.toLowerCase())
      );
    }

    if (query.startDate) {
      filtered = filtered.filter(log => log.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      filtered = filtered.filter(log => log.timestamp <= query.endDate!);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    
    return filtered.slice(offset, offset + limit);
  }

  // Verify log integrity
  async verifyIntegrity(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    for (let i = 0; i < this.logs.length; i++) {
      const log = this.logs[i];
      
      // Verify hash
      const expectedHash = await this.generateHash({
        id: log.id,
        timestamp: log.timestamp,
        userId: log.userId,
        userEmail: log.userEmail,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        sessionId: log.sessionId,
        metadata: log.metadata
      });

      if (expectedHash !== log.hash) {
        errors.push(`Hash mismatch for log ${log.id}`);
      }

      // Verify chain integrity
      if (i > 0) {
        const previousLog = this.logs[i - 1];
        if (log.previousHash !== previousLog.hash) {
          errors.push(`Chain broken at log ${log.id}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Export logs for compliance
  async exportLogs(format: 'json' | 'csv' = 'json'): Promise<string> {
    const logs = await this.queryLogs();
    
    if (format === 'csv') {
      const headers = [
        'ID', 'Timestamp', 'User ID', 'User Email', 'Action', 
        'Resource', 'Resource ID', 'IP Address', 'User Agent'
      ];
      
      const csvRows = [
        headers.join(','),
        ...logs.map(log => [
          log.id,
          log.timestamp.toISOString(),
          log.userId || '',
          log.userEmail || '',
          log.action,
          log.resource,
          log.resourceId || '',
          log.ipAddress || '',
          `"${log.userAgent || ''}"` // Quoted to handle commas
        ].join(','))
      ];
      
      return csvRows.join('\n');
    }

    return JSON.stringify(logs, null, 2);
  }

  // Clear logs (GDPR compliance - right to be forgotten)
  async clearUserLogs(userId: string): Promise<void> {
    console.warn(`Clearing audit logs for user ${userId} for GDPR compliance`);
    
    // In production, this would mark logs for anonymization rather than deletion
    // to maintain audit trail integrity while removing personal data
    this.logs = this.logs.map(log => {
      if (log.userId === userId) {
        return {
          ...log,
          userId: '[ANONYMIZED]',
          userEmail: '[ANONYMIZED]',
          details: { ...log.details, personalData: '[ANONYMIZED]' }
        };
      }
      return log;
    });

    await this.saveLogs();
  }

  // Get audit statistics
  getStatistics(): {
    totalLogs: number;
    dateRange: { start: Date | null; end: Date | null };
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
  } {
    const actionCounts: Record<string, number> = {};
    const userCounts: Record<string, number> = {};
    
    this.logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      if (log.userId) {
        userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
      }
    });

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const timestamps = this.logs.map(log => log.timestamp);
    const dateRange = {
      start: timestamps.length > 0 ? new Date(Math.min(...timestamps.map(d => d.getTime()))) : null,
      end: timestamps.length > 0 ? new Date(Math.max(...timestamps.map(d => d.getTime()))) : null
    };

    return {
      totalLogs: this.logs.length,
      dateRange,
      topActions,
      topUsers
    };
  }
}

// Audit action constants
export const AUDIT_ACTIONS = {
  // Authentication
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_SIGNUP: 'user.signup',
  
  // Tickets
  TICKET_CREATE: 'ticket.create',
  TICKET_VIEW: 'ticket.view',
  TICKET_UPDATE: 'ticket.update',
  TICKET_DELETE: 'ticket.delete',
  TICKET_ASSIGN: 'ticket.assign',
  
  // Media
  MEDIA_UPLOAD: 'media.upload',
  MEDIA_VIEW: 'media.view',
  MEDIA_DELETE: 'media.delete',
  
  // Admin
  USER_ROLE_CHANGE: 'user.role_change',
  USER_ACTIVATE: 'user.activate',
  USER_DEACTIVATE: 'user.deactivate',
  
  // Security
  UNAUTHORIZED_ACCESS: 'security.unauthorized_access',
  SUSPICIOUS_ACTIVITY: 'security.suspicious_activity'
} as const;

export const AUDIT_RESOURCES = {
  USER: 'user',
  TICKET: 'ticket',
  MEDIA: 'media',
  SYSTEM: 'system'
} as const;

// Export singleton instance
export const auditService = new AuditService();

// Auto-initialize
auditService.initialize().catch(console.error);

export default auditService;
