import { supabase } from '@/integrations/supabase/client';

// ==================== EMPLOYEES ====================
export interface HREmployee {
  id: string;
  company_id: string;
  employee_number: string | null;
  full_name: string;
  full_name_en: string | null;
  national_id: string | null;
  phone: string | null;
  email: string | null;
  department: string | null;
  job_title: string | null;
  hire_date: string | null;
  contract_type: string;
  base_salary: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowances: number;
  bank_name: string | null;
  iban: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchHREmployees(companyId: string) {
  const { data, error } = await supabase
    .from('hr_employees')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as HREmployee[];
}

export async function createHREmployee(employee: Partial<HREmployee> & { company_id: string; full_name: string }) {
  const { data, error } = await supabase.from('hr_employees').insert(employee).select().single();
  if (error) throw error;
  return data as HREmployee;
}

export async function updateHREmployee(id: string, updates: Partial<HREmployee>) {
  const { data, error } = await supabase.from('hr_employees').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as HREmployee;
}

export async function deleteHREmployee(id: string) {
  const { error } = await supabase.from('hr_employees').delete().eq('id', id);
  if (error) throw error;
}

// ==================== INSURANCE ====================
export interface HRInsuranceRecord {
  id: string;
  company_id: string;
  employee_id: string;
  gosi_number: string | null;
  registration_date: string | null;
  contribution_rate: number;
  employer_share: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchHRInsurance(companyId: string) {
  const { data, error } = await supabase
    .from('hr_insurance_records')
    .select('*, hr_employees(full_name, department)')
    .eq('company_id', companyId);
  if (error) throw error;
  return data;
}

export async function upsertHRInsurance(record: Partial<HRInsuranceRecord> & { company_id: string; employee_id: string }) {
  const { data, error } = await supabase.from('hr_insurance_records').upsert(record).select().single();
  if (error) throw error;
  return data;
}

// ==================== EVALUATIONS ====================
export interface HREvaluation {
  id: string;
  company_id: string;
  employee_id: string;
  evaluation_period: string | null;
  evaluator_name: string | null;
  overall_score: number;
  criteria: any[];
  strengths: string | null;
  weaknesses: string | null;
  goals: string | null;
  status: string;
  evaluation_date: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchHREvaluations(companyId: string) {
  const { data, error } = await supabase
    .from('hr_evaluations')
    .select('*, hr_employees(full_name, department)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createHREvaluation(evaluation: Partial<HREvaluation> & { company_id: string; employee_id: string }) {
  const { data, error } = await supabase.from('hr_evaluations').insert(evaluation).select().single();
  if (error) throw error;
  return data;
}

export async function updateHREvaluation(id: string, updates: Partial<HREvaluation>) {
  const { data, error } = await supabase.from('hr_evaluations').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ==================== TRAINING ====================
export interface HRTrainingCourse {
  id: string;
  company_id: string;
  name: string;
  name_en: string | null;
  provider: string | null;
  course_date: string | null;
  duration_hours: number;
  cost: number;
  location: string | null;
  max_attendees: number | null;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchHRTrainingCourses(companyId: string) {
  const { data, error } = await supabase
    .from('hr_training_courses')
    .select('*')
    .eq('company_id', companyId)
    .order('course_date', { ascending: false });
  if (error) throw error;
  return data as HRTrainingCourse[];
}

export async function createHRTrainingCourse(course: Partial<HRTrainingCourse> & { company_id: string; name: string }) {
  const { data, error } = await supabase.from('hr_training_courses').insert(course).select().single();
  if (error) throw error;
  return data as HRTrainingCourse;
}

export async function updateHRTrainingCourse(id: string, updates: Partial<HRTrainingCourse>) {
  const { data, error } = await supabase.from('hr_training_courses').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as HRTrainingCourse;
}

export async function deleteHRTrainingCourse(id: string) {
  const { error } = await supabase.from('hr_training_courses').delete().eq('id', id);
  if (error) throw error;
}

// ==================== TRAINING ATTENDEES ====================
export async function fetchTrainingAttendees(courseId: string) {
  const { data, error } = await supabase
    .from('hr_training_attendees')
    .select('*, hr_employees(full_name, department)')
    .eq('course_id', courseId);
  if (error) throw error;
  return data;
}

export async function addTrainingAttendee(attendee: { company_id: string; course_id: string; employee_id: string }) {
  const { data, error } = await supabase.from('hr_training_attendees').insert(attendee).select().single();
  if (error) throw error;
  return data;
}
