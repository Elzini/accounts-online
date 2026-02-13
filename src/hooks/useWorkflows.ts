import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import {
  fetchWorkflowTemplates,
  fetchWorkflowTemplate,
  createWorkflowTemplate,
  updateWorkflowTemplate,
  deleteWorkflowTemplate,
  fetchWorkflowStages,
  createWorkflowStage,
  updateWorkflowStage,
  deleteWorkflowStage,
  fetchStageFields,
  createStageField,
  updateStageField,
  deleteStageField,
  fetchAccountingRules,
  createAccountingRule,
  deleteAccountingRule,
  fetchWorkflowInstances,
  createWorkflowInstance,
  updateWorkflowInstance,
  fetchInstanceStages,
  createInstanceStage,
  updateInstanceStage,
  WorkflowTemplate,
  WorkflowStage,
  WorkflowStageField,
  WorkflowAccountingRule,
  WorkflowInstance,
  WorkflowInstanceStage,
} from '@/services/workflows';

// Templates
export function useWorkflowTemplates() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ['workflow-templates', companyId],
    queryFn: () => companyId ? fetchWorkflowTemplates(companyId) : [],
    enabled: !!companyId,
  });
}

export function useWorkflowTemplate(id: string | null) {
  return useQuery({
    queryKey: ['workflow-template', id],
    queryFn: () => id ? fetchWorkflowTemplate(id) : null,
    enabled: !!id,
  });
}

export function useCreateWorkflowTemplate() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (t: Partial<WorkflowTemplate>) => createWorkflowTemplate({ ...t, company_id: companyId! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflow-templates', companyId] }),
  });
}

export function useUpdateWorkflowTemplate() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<WorkflowTemplate> }) => updateWorkflowTemplate(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflow-templates', companyId] }),
  });
}

export function useDeleteWorkflowTemplate() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: deleteWorkflowTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflow-templates', companyId] }),
  });
}

// Stages
export function useWorkflowStages(workflowId: string | null) {
  return useQuery({
    queryKey: ['workflow-stages', workflowId],
    queryFn: () => workflowId ? fetchWorkflowStages(workflowId) : [],
    enabled: !!workflowId,
  });
}

export function useCreateWorkflowStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWorkflowStage,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['workflow-stages', vars.workflow_id] }),
  });
}

export function useUpdateWorkflowStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates, workflowId }: { id: string; updates: Partial<WorkflowStage>; workflowId: string }) =>
      updateWorkflowStage(id, updates),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['workflow-stages', vars.workflowId] }),
  });
}

export function useDeleteWorkflowStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, workflowId }: { id: string; workflowId: string }) => deleteWorkflowStage(id),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['workflow-stages', vars.workflowId] }),
  });
}

// Fields
export function useStageFields(stageId: string | null) {
  return useQuery({
    queryKey: ['stage-fields', stageId],
    queryFn: () => stageId ? fetchStageFields(stageId) : [],
    enabled: !!stageId,
  });
}

export function useCreateStageField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStageField,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['stage-fields', vars.stage_id] }),
  });
}

export function useUpdateStageField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates, stageId }: { id: string; updates: Partial<WorkflowStageField>; stageId: string }) =>
      updateStageField(id, updates),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['stage-fields', vars.stageId] }),
  });
}

export function useDeleteStageField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) => deleteStageField(id),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['stage-fields', vars.stageId] }),
  });
}

// Accounting Rules
export function useAccountingRules(stageId: string | null) {
  return useQuery({
    queryKey: ['accounting-rules', stageId],
    queryFn: () => stageId ? fetchAccountingRules(stageId) : [],
    enabled: !!stageId,
  });
}

export function useCreateAccountingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAccountingRule,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['accounting-rules', vars.stage_id] }),
  });
}

export function useDeleteAccountingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) => deleteAccountingRule(id),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['accounting-rules', vars.stageId] }),
  });
}

// Instances
export function useWorkflowInstances(workflowId?: string) {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ['workflow-instances', companyId, workflowId],
    queryFn: () => companyId ? fetchWorkflowInstances(companyId, workflowId) : [],
    enabled: !!companyId,
  });
}

export function useCreateWorkflowInstance() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: (i: Partial<WorkflowInstance>) => createWorkflowInstance({ ...i, company_id: companyId! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflow-instances'] }),
  });
}

export function useUpdateWorkflowInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<WorkflowInstance> }) => updateWorkflowInstance(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflow-instances'] }),
  });
}

// Instance Stages
export function useInstanceStages(instanceId: string | null) {
  return useQuery({
    queryKey: ['instance-stages', instanceId],
    queryFn: () => instanceId ? fetchInstanceStages(instanceId) : [],
    enabled: !!instanceId,
  });
}

export function useCreateInstanceStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInstanceStage,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['instance-stages', vars.instance_id] }),
  });
}

export function useUpdateInstanceStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates, instanceId }: { id: string; updates: Partial<WorkflowInstanceStage>; instanceId: string }) =>
      updateInstanceStage(id, updates),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['instance-stages', vars.instanceId] }),
  });
}
