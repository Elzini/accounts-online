import { supabase } from '@/integrations/supabase/client';

export interface AuditFixAction {
  id: string;
  label: string;
  description: string;
  severity: 'safe' | 'moderate' | 'dangerous';
  execute: () => Promise<AuditFixResult>;
}

export interface AuditFixResult {
  success: boolean;
  message: string;
  fixedCount?: number;
  details?: string[];
}

// ===== Fix: Recalculate unbalanced journal entry totals from their lines =====
export function createFixUnbalancedEntries(
  companyId: string,
  entryIds: string[]
): AuditFixAction {
  return {
    id: 'fix-unbalanced-entries',
    label: 'إعادة حساب الإجماليات',
    description: `سيتم إعادة حساب إجمالي المدين والدائن لـ ${entryIds.length} قيد من سطور القيد الفعلية. هذا الإصلاح آمن ولا يحذف أي بيانات.`,
    severity: 'safe',
    execute: async () => {
      let fixedCount = 0;
      const details: string[] = [];

      for (const entryId of entryIds) {
        const { data: lines } = await supabase
          .from('journal_entry_lines')
          .select('debit, credit')
          .eq('journal_entry_id', entryId);

        if (lines) {
          const totalDebit = lines.reduce((s, l) => s + Number(l.debit), 0);
          const totalCredit = lines.reduce((s, l) => s + Number(l.credit), 0);

          const { error } = await supabase
            .from('journal_entries')
            .update({ total_debit: totalDebit, total_credit: totalCredit })
            .eq('id', entryId)
            .eq('company_id', companyId);

          if (!error) {
            fixedCount++;
            details.push(`تم تحديث القيد: مدين=${totalDebit.toFixed(2)}, دائن=${totalCredit.toFixed(2)}`);
          }
        }
      }

      return {
        success: fixedCount > 0,
        message: fixedCount > 0
          ? `تم إصلاح ${fixedCount} قيد بنجاح`
          : 'لم يتم إصلاح أي قيد',
        fixedCount,
        details,
      };
    },
  };
}

// ===== Fix: Sync journal entry totals with their lines =====
export function createFixLinesTotalsMismatch(
  companyId: string,
  entryIds: string[]
): AuditFixAction {
  return {
    id: 'fix-lines-totals-mismatch',
    label: 'مزامنة الإجماليات مع السطور',
    description: `سيتم تحديث إجمالي ${entryIds.length} قيد ليتطابق مع مجموع سطوره. هذا الإصلاح آمن.`,
    severity: 'safe',
    execute: async () => {
      let fixedCount = 0;

      for (const entryId of entryIds) {
        const { data: lines } = await supabase
          .from('journal_entry_lines')
          .select('debit, credit')
          .eq('journal_entry_id', entryId);

        if (lines) {
          const totalDebit = lines.reduce((s, l) => s + Number(l.debit), 0);
          const totalCredit = lines.reduce((s, l) => s + Number(l.credit), 0);

          const { error } = await supabase
            .from('journal_entries')
            .update({ total_debit: totalDebit, total_credit: totalCredit })
            .eq('id', entryId)
            .eq('company_id', companyId);

          if (!error) fixedCount++;
        }
      }

      return {
        success: fixedCount > 0,
        message: `تم مزامنة ${fixedCount} قيد بنجاح`,
        fixedCount,
      };
    },
  };
}

// ===== Fix: Delete orphaned journal entries linked to deleted sales =====
export function createFixOrphanedSaleEntries(
  companyId: string,
  entryIds: string[]
): AuditFixAction {
  return {
    id: 'fix-orphaned-sale-entries',
    label: 'حذف القيود اليتيمة',
    description: `سيتم حذف ${entryIds.length} قيد مرتبط بفواتير بيع محذوفة. ⚠️ هذا الإجراء لا يمكن التراجع عنه.`,
    severity: 'dangerous',
    execute: async () => {
      let deletedCount = 0;

      for (const entryId of entryIds) {
        // Delete lines first
        await supabase
          .from('journal_entry_lines')
          .delete()
          .eq('journal_entry_id', entryId);

        // Delete entry
        const { error } = await supabase
          .from('journal_entries')
          .delete()
          .eq('id', entryId)
          .eq('company_id', companyId);

        if (!error) deletedCount++;
      }

      return {
        success: deletedCount > 0,
        message: `تم حذف ${deletedCount} قيد يتيم بنجاح`,
        fixedCount: deletedCount,
      };
    },
  };
}

// ===== Fix: Create default tax settings =====
export function createFixMissingTaxSettings(companyId: string): AuditFixAction {
  return {
    id: 'fix-missing-tax-settings',
    label: 'إنشاء إعدادات ضريبية افتراضية',
    description: 'سيتم إنشاء إعدادات ضريبة القيمة المضافة بنسبة 15% (غير مفعلة). يمكنك تعديلها لاحقاً.',
    severity: 'safe',
    execute: async () => {
      const { error } = await supabase
        .from('tax_settings')
        .insert({
          company_id: companyId,
          tax_name: 'ضريبة القيمة المضافة',
          tax_rate: 15.00,
          is_active: false,
          apply_to_sales: true,
          apply_to_purchases: true,
        });

      return {
        success: !error,
        message: error ? `خطأ: ${error.message}` : 'تم إنشاء إعدادات الضريبة الافتراضية بنجاح',
        fixedCount: error ? 0 : 1,
      };
    },
  };
}

// ===== Fix: Initialize COA from templates =====
export function createFixMissingCOA(companyId: string, companyType: 'car_dealership' | 'construction' | 'export_import' | 'general_trading' | 'restaurant'): AuditFixAction {
  return {
    id: 'fix-missing-coa',
    label: 'إنشاء شجرة حسابات من القالب',
    description: `سيتم إنشاء شجرة حسابات كاملة بناءً على قالب "${companyType}". هذه العملية لا تحذف أي حسابات موجودة.`,
    severity: 'moderate',
    execute: async () => {
      // Get templates
      const { data: templates, error: tErr } = await supabase
        .from('coa_templates')
        .select('*')
        .eq('company_type', companyType)
        .order('sort_order');

      if (tErr || !templates || templates.length === 0) {
        return {
          success: false,
          message: 'لم يتم العثور على قالب حسابات لهذا النشاط',
        };
      }

      let insertedCount = 0;
      const parentMap: Record<string, string> = {};

      for (const template of templates) {
        const parentId = template.parent_code ? parentMap[template.parent_code] || null : null;

        const { data: inserted, error: insErr } = await supabase
          .from('account_categories')
          .insert({
            company_id: companyId,
            code: template.code,
            name: template.name,
            type: template.type,
            parent_id: parentId,
            is_system: template.is_header || false,
          })
          .select('id')
          .single();

        if (!insErr && inserted) {
          parentMap[template.code] = inserted.id;
          insertedCount++;
        }
      }

      return {
        success: insertedCount > 0,
        message: `تم إنشاء ${insertedCount} حساب من القالب`,
        fixedCount: insertedCount,
      };
    },
  };
}

// ===== Fix: Remove negative amounts by converting to absolute values =====
export function createFixNegativeAmounts(
  companyId: string,
  lineIds: string[]
): AuditFixAction {
  return {
    id: 'fix-negative-amounts',
    label: 'تحويل المبالغ السالبة لموجبة',
    description: `سيتم تحويل ${lineIds.length} سطر يحتوي على مبالغ سالبة إلى قيم مطلقة (موجبة). يجب مراجعة القيود بعد الإصلاح.`,
    severity: 'moderate',
    execute: async () => {
      let fixedCount = 0;

      for (const lineId of lineIds) {
        const { data: line } = await supabase
          .from('journal_entry_lines')
          .select('debit, credit')
          .eq('id', lineId)
          .single();

        if (line) {
          const updates: Record<string, number> = {};
          if (Number(line.debit) < 0) updates.debit = Math.abs(Number(line.debit));
          if (Number(line.credit) < 0) updates.credit = Math.abs(Number(line.credit));

          if (Object.keys(updates).length > 0) {
            const { error } = await supabase
              .from('journal_entry_lines')
              .update(updates)
              .eq('id', lineId);

            if (!error) fixedCount++;
          }
        }
      }

      return {
        success: fixedCount > 0,
        message: `تم إصلاح ${fixedCount} سطر بنجاح`,
        fixedCount,
      };
    },
  };
}

// ===== Fix: Delete duplicate journal entries (keep the first) =====
export function createFixDuplicateEntries(
  companyId: string,
  duplicateEntryIds: string[]
): AuditFixAction {
  return {
    id: 'fix-duplicate-entries',
    label: 'حذف القيود المكررة',
    description: `سيتم حذف ${duplicateEntryIds.length} قيد مكرر مع الاحتفاظ بالقيد الأصلي. ⚠️ هذا الإجراء لا يمكن التراجع عنه.`,
    severity: 'dangerous',
    execute: async () => {
      let deletedCount = 0;

      for (const entryId of duplicateEntryIds) {
        await supabase
          .from('journal_entry_lines')
          .delete()
          .eq('journal_entry_id', entryId);

        const { error } = await supabase
          .from('journal_entries')
          .delete()
          .eq('id', entryId)
          .eq('company_id', companyId);

        if (!error) deletedCount++;
      }

      return {
        success: deletedCount > 0,
        message: `تم حذف ${deletedCount} قيد مكرر بنجاح`,
        fixedCount: deletedCount,
      };
    },
  };
}
