import type { AuditEvent } from './admin';

/**
 * Admin audit trail.
 * Signatures mirror the methods already exposed by `mockAuditService`.
 */
export interface AuditService {
  getEvents(): Promise<AuditEvent[]>;
  logEvent(event: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<AuditEvent>;
}
