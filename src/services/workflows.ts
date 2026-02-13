import { supabase } from '@/integrations/supabase/client';

export interface WorkflowTemplate {
  id: string;
  company_id: string;
  name: string;
  name_en?: string;
  description?: string;
  icon: string;
  color: string;
  is_active: boolean;
  is_system: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  stages?: WorkflowStage[];
}

export interface WorkflowStage {
  id: string;
  workflow_id: string;
  name: string;
  name_en?: string;
  description?: string;
  stage_order: number;
  stage_type: string;
  color: string;
  icon: string;
  requires_approval: boolean;
  approval_roles?: string[];
  auto_advance: boolean;
  time_limit_hours?: number;
  created_at: string;
  fields?: WorkflowStageField[];
  accounting_rules?: WorkflowAccountingRule[];
}

export interface WorkflowStageField {
  id: string;
  stage_id: string;
  field_name: string;
  field_label: string;
  field_label_en?: string;
  field_type: string;
  field_options?: any;
  is_required: boolean;
  default_value?: string;
  field_order: number;
  validation_rules?: any;
  created_at: string;
}

export interface WorkflowAccountingRule {
  id: string;
  stage_id: string;
  trigger_on: string;
  description?: string;
  debit_account_id?: string;
  credit_account_id?: string;
  amount_source: string;
  amount_field_name?: string;
  amount_fixed?: number;
  amount_formula?: string;
  cost_center_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface WorkflowTransition {
  id: string;
  workflow_id: string;
  from_stage_id?: string;
  to_stage_id: string;
  condition_type: string;
  condition_config?: any;
  label?: string;
  label_en?: string;
}

export interface WorkflowInstance {
  id: string;
  workflow_id: string;
  company_id: string;
  reference_number?: string;
  title: string;
  current_stage_id?: string;
  status: string;
  started_by?: string;
  started_at: string;
  completed_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  workflow?: WorkflowTemplate;
  current_stage?: WorkflowStage;
}

export interface WorkflowInstanceStage {
  id: string;
  instance_id: string;
  stage_id: string;
  stage_data: Record<string, any>;
  status: string;
  entered_at?: string;
  completed_at?: string;
  completed_by?: string;
  approval_status?: string;
  approval_by?: string;
  approval_at?: string;
  approval_notes?: string;
  journal_entry_ids?: string[];
  notes?: string;
  created_at: string;
  stage?: WorkflowStage;
}

// ============ Template CRUD ============

export async function fetchWorkflowTemplates(companyId: string): Promise<WorkflowTemplate[]> {
  const { data, error } = await supabase
    .from('workflow_templates' as any)
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as any;
}

export async function fetchWorkflowTemplate(id: string): Promise<WorkflowTemplate | null> {
  const { data, error } = await supabase
    .from('workflow_templates' as any)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as any;
}

export async function createWorkflowTemplate(template: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
  const { data, error } = await supabase
    .from('workflow_templates' as any)
    .insert(template as any)
    .select()
    .single();
  if (error) throw error;
  return data as any;
}

export async function updateWorkflowTemplate(id: string, updates: Partial<WorkflowTemplate>): Promise<void> {
  const { error } = await supabase
    .from('workflow_templates' as any)
    .update(updates as any)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteWorkflowTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('workflow_templates' as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============ Stages CRUD ============

export async function fetchWorkflowStages(workflowId: string): Promise<WorkflowStage[]> {
  const { data, error } = await supabase
    .from('workflow_stages' as any)
    .select('*')
    .eq('workflow_id', workflowId)
    .order('stage_order', { ascending: true });
  if (error) throw error;
  return (data || []) as any;
}

export async function createWorkflowStage(stage: Partial<WorkflowStage>): Promise<WorkflowStage> {
  const { data, error } = await supabase
    .from('workflow_stages' as any)
    .insert(stage as any)
    .select()
    .single();
  if (error) throw error;
  return data as any;
}

export async function updateWorkflowStage(id: string, updates: Partial<WorkflowStage>): Promise<void> {
  const { error } = await supabase
    .from('workflow_stages' as any)
    .update(updates as any)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteWorkflowStage(id: string): Promise<void> {
  const { error } = await supabase
    .from('workflow_stages' as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============ Stage Fields CRUD ============

export async function fetchStageFields(stageId: string): Promise<WorkflowStageField[]> {
  const { data, error } = await supabase
    .from('workflow_stage_fields' as any)
    .select('*')
    .eq('stage_id', stageId)
    .order('field_order', { ascending: true });
  if (error) throw error;
  return (data || []) as any;
}

export async function createStageField(field: Partial<WorkflowStageField>): Promise<WorkflowStageField> {
  const { data, error } = await supabase
    .from('workflow_stage_fields' as any)
    .insert(field as any)
    .select()
    .single();
  if (error) throw error;
  return data as any;
}

export async function updateStageField(id: string, updates: Partial<WorkflowStageField>): Promise<void> {
  const { error } = await supabase
    .from('workflow_stage_fields' as any)
    .update(updates as any)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteStageField(id: string): Promise<void> {
  const { error } = await supabase
    .from('workflow_stage_fields' as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============ Accounting Rules CRUD ============

export async function fetchAccountingRules(stageId: string): Promise<WorkflowAccountingRule[]> {
  const { data, error } = await supabase
    .from('workflow_accounting_rules' as any)
    .select('*')
    .eq('stage_id', stageId);
  if (error) throw error;
  return (data || []) as any;
}

export async function createAccountingRule(rule: Partial<WorkflowAccountingRule>): Promise<WorkflowAccountingRule> {
  const { data, error } = await supabase
    .from('workflow_accounting_rules' as any)
    .insert(rule as any)
    .select()
    .single();
  if (error) throw error;
  return data as any;
}

export async function deleteAccountingRule(id: string): Promise<void> {
  const { error } = await supabase
    .from('workflow_accounting_rules' as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============ Instances CRUD ============

export async function fetchWorkflowInstances(companyId: string, workflowId?: string): Promise<WorkflowInstance[]> {
  let query = supabase
    .from('workflow_instances' as any)
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  
  if (workflowId) {
    query = query.eq('workflow_id', workflowId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as any;
}

export async function createWorkflowInstance(instance: Partial<WorkflowInstance>): Promise<WorkflowInstance> {
  const { data, error } = await supabase
    .from('workflow_instances' as any)
    .insert(instance as any)
    .select()
    .single();
  if (error) throw error;
  return data as any;
}

export async function updateWorkflowInstance(id: string, updates: Partial<WorkflowInstance>): Promise<void> {
  const { error } = await supabase
    .from('workflow_instances' as any)
    .update(updates as any)
    .eq('id', id);
  if (error) throw error;
}

// ============ Instance Stages ============

export async function fetchInstanceStages(instanceId: string): Promise<WorkflowInstanceStage[]> {
  const { data, error } = await supabase
    .from('workflow_instance_stages' as any)
    .select('*')
    .eq('instance_id', instanceId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as any;
}

export async function createInstanceStage(stage: Partial<WorkflowInstanceStage>): Promise<WorkflowInstanceStage> {
  const { data, error } = await supabase
    .from('workflow_instance_stages' as any)
    .insert(stage as any)
    .select()
    .single();
  if (error) throw error;
  return data as any;
}

export async function updateInstanceStage(id: string, updates: Partial<WorkflowInstanceStage>): Promise<void> {
  const { error } = await supabase
    .from('workflow_instance_stages' as any)
    .update(updates as any)
    .eq('id', id);
  if (error) throw error;
}

// ============ Field Type Definitions ============

export const FIELD_TYPES = [
  { value: 'text', label: 'نص', label_en: 'Text' },
  { value: 'number', label: 'رقم', label_en: 'Number' },
  { value: 'currency', label: 'مبلغ مالي', label_en: 'Currency' },
  { value: 'date', label: 'تاريخ', label_en: 'Date' },
  { value: 'select', label: 'قائمة اختيار', label_en: 'Select' },
  { value: 'textarea', label: 'نص طويل', label_en: 'Textarea' },
  { value: 'checkbox', label: 'مربع اختيار', label_en: 'Checkbox' },
  { value: 'file', label: 'مرفق', label_en: 'File' },
];

export const STAGE_TYPES = [
  { value: 'task', label: 'مهمة', label_en: 'Task' },
  { value: 'approval', label: 'موافقة', label_en: 'Approval' },
  { value: 'decision', label: 'قرار', label_en: 'Decision' },
  { value: 'notification', label: 'إشعار', label_en: 'Notification' },
  { value: 'accounting', label: 'قيد محاسبي', label_en: 'Accounting' },
];

export const STAGE_ICONS = [
  'Circle', 'CheckCircle', 'Clock', 'FileText', 'Package', 'Truck', 
  'DollarSign', 'Shield', 'Star', 'Flag', 'AlertCircle', 'Archive',
  'Box', 'Clipboard', 'Send', 'ThumbsUp', 'Eye', 'Lock',
];
