import { mockAdminService } from '@/api/mock/mockAdminService';
import { useMocks } from '@/services/serviceMode';
import { unimplementedService } from '@/services/unimplementedService';
export const adminService = useMocks() ? mockAdminService : unimplementedService('adminService');
