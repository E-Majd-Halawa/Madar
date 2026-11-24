import { mockAuditService } from '@/api/mock/mockAuditService';
import { useMocks } from '@/services/serviceMode';
import { unimplementedService } from '@/services/unimplementedService';
export const auditService = useMocks() ? mockAuditService : unimplementedService('auditService');
