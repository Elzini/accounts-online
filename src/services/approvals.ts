/**
 * Approvals Service - Workflows, requests, actions, delegations
 */
import { supabase } from '@/integrations/supabase/client';

// ── Queries ──
export async function fetchApprovalWorkflows(companyId: string) {
  const { data } = await supabase.from('approval_workflows').select('*, approval_steps(*)').eq('company_id', companyId).order('created_at', { ascending: false });
  return data || [];
}

export async function fetchApprovalWorkflowsSimple(companyId: string) {
  const { data } = await supabase.from('approval_workflows').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
  return data || [];
}

export async function fetchApprovalRequests(companyId: string) {
  const { data } = await supabase.from('approval_requests').select('*, approval_workflows(name, entity_type, min_amount, max_amount)').eq('company_id', companyId).order('requested_at', { ascending: false });
  return data || [];
}

export async function fetchApprovalActions(requestIds: string[]) {
  if (requestIds.length === 0) return [];
  const { data } = await supabase.from('approval_actions').select('*').in('request_id', requestIds).order('acted_at', { ascending: false });
  return data || [];
}

export async function fetchApprovalDelegations(companyId: string) {
  const { data } = await supabase.from('approval_delegations' as any).select('*').eq('company_id', companyId).order('created_at', { ascending: false });
  return (data || []) as any[];
}

export async function fetchCompanyUsers(companyId: string) {
  const { data } = await supabase.from('profiles').select('user_id, username').eq('company_id', companyId);
  return data || [];
}

// ── Mutations ──
export async function createApprovalWorkflow(companyId: string, form: { name: string; entity_type: string; min_amount?: number; max_amount?: number | null }) {
  const { error } = await supabase.from('approval_workflows').insert({
    company_id: companyId, name: form.name, entity_type: form.entity_type,
    min_amount: form.min_amount || 0, max_amount: form.max_amount ?? null,
  });
  if (error) throw error;
}

export async function processApprovalAction(requestId: string, action: string, workflowId: string, currentStep: number, comments?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: steps } = await supabase.from('approval_steps').select('*').eq('workflow_id', workflowId).order('step_order', { ascending: true });
  const step = steps?.find((s: any) => s.step_order === (currentStep || 1));
  if (!step) throw new Error('Step not found');

  await supabase.from('approval_actions').insert({
    request_id: requestId, step_id: step.id, acted_by: user.id, action, comments: comments || null,
  });

  if (action === 'approve') {
    const nextStep = steps?.find((s: any) => s.step_order === (currentStep || 1) + 1);
    if (nextStep) {
      await supabase.from('approval_requests').update({ current_step: nextStep.step_order }).eq('id', requestId);
    } else {
      await supabase.from('approval_requests').update({ status: 'approved', completed_at: new Date().toISOString() }).eq('id', requestId);
    }
  } else if (action === 'reject') {
    await supabase.from('approval_requests').update({ status: 'rejected', completed_at: new Date().toISOString() }).eq('id', requestId);
  }
}

export async function addApprovalDelegation(companyId: string, form: { delegate_user_id: string; start_date: string; end_date: string; reason?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase.from('approval_delegations' as any).insert({
    company_id: companyId, delegator_user_id: user.id, ...form, reason: form.reason || null,
  } as any);
  if (error) throw error;
}

export async function createApprovalSteps(workflowId: string, stepsData: Array<{ step_order: number; approver_role?: string; approver_user_id?: string; is_mandatory?: boolean; company_id?: string }>) {
  const { error } = await supabase.from('approval_steps').insert(stepsData);
  if (error) throw error;
}

export async function submitApprovalRequest(companyId: string, form: { workflow_id: string; entity_type: string; entity_id: string; requested_by: string; notes?: string }) {
  const { error } = await supabase.from('approval_requests').insert({ company_id: companyId, ...form, status: 'pending', current_step: 1 });
  if (error) throw error;
}
