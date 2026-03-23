/**
 * Journal Entries Page - Slim Orchestrator
 * Logic extracted to useJournalEntryForm hook.
 * UI split into JournalEntryFormDialog and JournalEntriesListCard.
 */
import { Loader2, FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJournalEntryForm } from './hooks/useJournalEntryForm';
import { JournalEntryFormDialog } from './sections/JournalEntryFormDialog';
import { JournalEntriesListCard } from './sections/JournalEntriesListCard';
import { JournalEntryEditDialog } from './JournalEntryEditDialog';
import { JournalAttachments } from './JournalAttachments';
import { JournalEntryPrintDialog } from './JournalEntryPrintDialog';
import { RealEstateJournalTemplates } from './RealEstateJournalTemplates';

export function JournalEntriesPage() {
  const hook = useJournalEntryForm();
  const {
    t, direction, language, isLoading, isRealEstate,
    viewingEntryId, setViewingEntryId,
    attachmentEntryId, setAttachmentEntryId,
    printingEntryId, setPrintingEntryId, printingEntry,
    filteredEntries, printJournalSheet, printDetailedJournal,
    handleTemplateSelect,
  } = hook;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={direction}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.je_title}</h1>
          <p className="text-muted-foreground">{t.je_subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={printJournalSheet} className="gap-2">
            <FileText className="w-4 h-4" />
            {language === 'ar' ? 'طباعة كشف القيود' : 'Print Journal Sheet'}
          </Button>
          <Button variant="outline" onClick={() => printDetailedJournal(filteredEntries.map((e: any) => e.id))} className="gap-2">
            <Printer className="w-4 h-4" />
            {language === 'ar' ? 'طباعة تفصيلية' : 'Detailed Print'}
          </Button>
          {isRealEstate && <RealEstateJournalTemplates onSelectTemplate={handleTemplateSelect} />}
          <JournalEntryFormDialog hook={hook} />
        </div>
      </div>

      {/* View/Edit Entry Dialog */}
      <JournalEntryEditDialog
        entryId={viewingEntryId}
        open={!!viewingEntryId}
        onOpenChange={(open) => !open && setViewingEntryId(null)}
        title={t.je_details_title}
      />

      {/* Entries List */}
      <JournalEntriesListCard hook={hook} />

      {/* Attachments Dialog */}
      {attachmentEntryId && (
        <JournalAttachments
          entryId={attachmentEntryId}
          open={!!attachmentEntryId}
          onOpenChange={(open) => !open && setAttachmentEntryId(null)}
        />
      )}

      {/* Print Dialog */}
      {printingEntry && (
        <JournalEntryPrintDialog
          entry={printingEntry}
          open={!!printingEntryId}
          onOpenChange={(open) => !open && setPrintingEntryId(null)}
        />
      )}
    </div>
  );
}
