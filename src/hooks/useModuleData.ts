import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

// Generic hook factory for simple CRUD modules
function useModuleQuery<T>(table: string, queryKey: string, orderBy = 'created_at') {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: [queryKey, companyId],
    queryFn: async () => {
      if (!companyId) return [] as T[];
      const { data, error } = await (supabase as any).from(table).select('*').eq('company_id', companyId).order(orderBy, { ascending: false });
      if (error) throw error;
      return (data || []) as T[];
    },
    enabled: !!companyId,
  });
}

function useModuleAdd(table: string, queryKey: string) {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      if (!companyId) throw new Error('No company');
      const { data: result, error } = await (supabase as any).from(table).insert({ ...data, company_id: companyId }).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey, companyId] });
      toast.success('تم الإضافة بنجاح');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

function useModuleUpdate(table: string, queryKey: string) {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { error } = await (supabase as any).from(table).update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey, companyId] });
      toast.success('تم التحديث بنجاح');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

function useModuleDelete(table: string, queryKey: string) {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey, companyId] });
      toast.success('تم الحذف بنجاح');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ===== PLM =====
export const usePlmProducts = () => useModuleQuery<any>('plm_products', 'plm-products');
export const useAddPlmProduct = () => useModuleAdd('plm_products', 'plm-products');
export const useUpdatePlmProduct = () => useModuleUpdate('plm_products', 'plm-products');
export const useDeletePlmProduct = () => useModuleDelete('plm_products', 'plm-products');

export const usePlmEcos = () => useModuleQuery<any>('plm_engineering_changes', 'plm-ecos');
export const useAddPlmEco = () => useModuleAdd('plm_engineering_changes', 'plm-ecos');
export const useUpdatePlmEco = () => useModuleUpdate('plm_engineering_changes', 'plm-ecos');

// ===== Recruitment =====
export const useRecruitmentJobs = () => useModuleQuery<any>('recruitment_jobs', 'recruitment-jobs');
export const useAddRecruitmentJob = () => useModuleAdd('recruitment_jobs', 'recruitment-jobs');
export const useUpdateRecruitmentJob = () => useModuleUpdate('recruitment_jobs', 'recruitment-jobs');
export const useDeleteRecruitmentJob = () => useModuleDelete('recruitment_jobs', 'recruitment-jobs');

export const useRecruitmentCandidates = () => useModuleQuery<any>('recruitment_candidates', 'recruitment-candidates');
export const useAddRecruitmentCandidate = () => useModuleAdd('recruitment_candidates', 'recruitment-candidates');
export const useUpdateRecruitmentCandidate = () => useModuleUpdate('recruitment_candidates', 'recruitment-candidates');
export const useDeleteRecruitmentCandidate = () => useModuleDelete('recruitment_candidates', 'recruitment-candidates');

// ===== Fleet =====
export const useFleetVehicles = () => useModuleQuery<any>('fleet_vehicles', 'fleet-vehicles');
export const useAddFleetVehicle = () => useModuleAdd('fleet_vehicles', 'fleet-vehicles');
export const useUpdateFleetVehicle = () => useModuleUpdate('fleet_vehicles', 'fleet-vehicles');
export const useDeleteFleetVehicle = () => useModuleDelete('fleet_vehicles', 'fleet-vehicles');

export const useFleetServiceLogs = () => useModuleQuery<any>('fleet_service_logs', 'fleet-services');
export const useAddFleetServiceLog = () => useModuleAdd('fleet_service_logs', 'fleet-services');

// ===== Maintenance =====
export const useMaintenanceEquipment = () => useModuleQuery<any>('maintenance_equipment', 'maint-equipment');
export const useAddMaintenanceEquipment = () => useModuleAdd('maintenance_equipment', 'maint-equipment');
export const useUpdateMaintenanceEquipment = () => useModuleUpdate('maintenance_equipment', 'maint-equipment');
export const useDeleteMaintenanceEquipment = () => useModuleDelete('maintenance_equipment', 'maint-equipment');

export const useMaintenanceRequests = () => useModuleQuery<any>('maintenance_requests', 'maint-requests');
export const useAddMaintenanceRequest = () => useModuleAdd('maintenance_requests', 'maint-requests');
export const useUpdateMaintenanceRequest = () => useModuleUpdate('maintenance_requests', 'maint-requests');

// ===== Quality =====
export const useQualityChecks = () => useModuleQuery<any>('quality_checks', 'quality-checks');
export const useAddQualityCheck = () => useModuleAdd('quality_checks', 'quality-checks');
export const useUpdateQualityCheck = () => useModuleUpdate('quality_checks', 'quality-checks');

// ===== Events =====
export const useEvents = () => useModuleQuery<any>('events', 'events');
export const useAddEvent = () => useModuleAdd('events', 'events');
export const useUpdateEvent = () => useModuleUpdate('events', 'events');
export const useDeleteEvent = () => useModuleDelete('events', 'events');

// ===== Surveys =====
export const useSurveys = () => useModuleQuery<any>('surveys', 'surveys');
export const useAddSurvey = () => useModuleAdd('surveys', 'surveys');
export const useUpdateSurvey = () => useModuleUpdate('surveys', 'surveys');
export const useDeleteSurvey = () => useModuleDelete('surveys', 'surveys');

// ===== eLearning =====
export const useElearningCourses = () => useModuleQuery<any>('elearning_courses', 'elearning-courses');
export const useAddElearningCourse = () => useModuleAdd('elearning_courses', 'elearning-courses');
export const useUpdateElearningCourse = () => useModuleUpdate('elearning_courses', 'elearning-courses');
export const useDeleteElearningCourse = () => useModuleDelete('elearning_courses', 'elearning-courses');

// ===== Knowledge Base =====
export const useKnowledgeArticles = () => useModuleQuery<any>('knowledge_articles', 'knowledge-articles');
export const useAddKnowledgeArticle = () => useModuleAdd('knowledge_articles', 'knowledge-articles');
export const useUpdateKnowledgeArticle = () => useModuleUpdate('knowledge_articles', 'knowledge-articles');
export const useDeleteKnowledgeArticle = () => useModuleDelete('knowledge_articles', 'knowledge-articles');

// ===== Chat =====
export const useChatChannels = () => useModuleQuery<any>('chat_channels', 'chat-channels');
export const useAddChatChannel = () => useModuleAdd('chat_channels', 'chat-channels');

export function useChatMessages(channelId: string | null) {
  return useQuery({
    queryKey: ['chat-messages', channelId],
    queryFn: async () => {
      if (!channelId) return [];
      const { data, error } = await (supabase as any).from('chat_messages').select('*').eq('channel_id', channelId).order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!channelId,
  });
}

export function useAddChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { channel_id: string; sender_name: string; content: string }) => {
      const { data: result, error } = await (supabase as any).from('chat_messages').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['chat-messages', vars.channel_id] }),
    onError: (e: any) => toast.error(e.message),
  });
}

// ===== E-Signature =====
export const useSignatureRequests = () => useModuleQuery<any>('signature_requests', 'signature-requests');
export const useAddSignatureRequest = () => useModuleAdd('signature_requests', 'signature-requests');
export const useUpdateSignatureRequest = () => useModuleUpdate('signature_requests', 'signature-requests');

// ===== Planning =====
export const usePlanningShifts = () => useModuleQuery<any>('planning_shifts', 'planning-shifts');
export const useAddPlanningShift = () => useModuleAdd('planning_shifts', 'planning-shifts');
export const useUpdatePlanningShift = () => useModuleUpdate('planning_shifts', 'planning-shifts');
export const useDeletePlanningShift = () => useModuleDelete('planning_shifts', 'planning-shifts');

// ===== Field Service =====
export const useFieldServiceOrders = () => useModuleQuery<any>('field_service_orders', 'field-service');
export const useAddFieldServiceOrder = () => useModuleAdd('field_service_orders', 'field-service');
export const useUpdateFieldServiceOrder = () => useModuleUpdate('field_service_orders', 'field-service');
export const useDeleteFieldServiceOrder = () => useModuleDelete('field_service_orders', 'field-service');

// ===== Appraisals =====
export const useAppraisals = () => useModuleQuery<any>('appraisals', 'appraisals');
export const useAddAppraisal = () => useModuleAdd('appraisals', 'appraisals');
export const useUpdateAppraisal = () => useModuleUpdate('appraisals', 'appraisals');
export const useDeleteAppraisal = () => useModuleDelete('appraisals', 'appraisals');

// ===== POS =====
export const usePOSSessions = () => useModuleQuery<any>('pos_sessions', 'pos-sessions');
export const useAddPOSSession = () => useModuleAdd('pos_sessions', 'pos-sessions');
export const useUpdatePOSSession = () => useModuleUpdate('pos_sessions', 'pos-sessions');

export const usePOSOrders = () => useModuleQuery<any>('pos_orders', 'pos-orders');
export function useAddPOSOrder() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async (data: { order: Record<string, any>; lines: Array<Record<string, any>> }) => {
      if (!companyId) throw new Error('No company');
      const { data: order, error: orderErr } = await (supabase as any).from('pos_orders').insert({ ...data.order, company_id: companyId }).select().single();
      if (orderErr) throw orderErr;
      if (data.lines.length > 0) {
        const linesWithOrderId = data.lines.map(l => ({ ...l, order_id: order.id }));
        const { error: linesErr } = await (supabase as any).from('pos_order_lines').insert(linesWithOrderId);
        if (linesErr) throw linesErr;
      }
      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pos-orders', companyId] });
      qc.invalidateQueries({ queryKey: ['pos-sessions', companyId] });
      toast.success('تم إنشاء الطلب بنجاح');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ===== SMS Campaigns =====
export const useSmsCampaigns = () => useModuleQuery<any>('sms_campaigns', 'sms-campaigns');
export const useAddSmsCampaign = () => useModuleAdd('sms_campaigns', 'sms-campaigns');
export const useUpdateSmsCampaign = () => useModuleUpdate('sms_campaigns', 'sms-campaigns');

// ===== Social Posts =====
export const useSocialPosts = () => useModuleQuery<any>('social_posts', 'social-posts');
export const useAddSocialPost = () => useModuleAdd('social_posts', 'social-posts');
export const useUpdateSocialPost = () => useModuleUpdate('social_posts', 'social-posts');
export const useDeleteSocialPost = () => useModuleDelete('social_posts', 'social-posts');

// ===== Bookings (Appointments) - uses existing table =====
export const useBookings = () => useModuleQuery<any>('bookings', 'bookings');
export const useAddBooking = () => useModuleAdd('bookings', 'bookings');
export const useUpdateBooking = () => useModuleUpdate('bookings', 'bookings');
export const useDeleteBooking = () => useModuleDelete('bookings', 'bookings');
