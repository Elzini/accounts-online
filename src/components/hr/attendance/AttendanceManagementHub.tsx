import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Settings, FileText, Monitor, Users, Clock, Upload, Download, CalendarDays, BarChart3 } from 'lucide-react';
import { DeviceOperationsPanel } from './DeviceOperationsPanel';
import { WorkSchedulesPanel } from './WorkSchedulesPanel';
import { HolidaysPanel } from './HolidaysPanel';
import { AttendanceReportsPanel } from './AttendanceReportsPanel';
import { ImportLogsPanel } from './ImportLogsPanel';

type ActiveSection = 'home' | 'setup' | 'operations' | 'reports' | 'users' | 'import' | 'schedules' | 'holidays';

export function AttendanceManagementHub() {
  const { language } = useLanguage();
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');

  const sections = [
    { id: 'setup' as const, label: language === 'ar' ? 'التجهيز' : 'Setup', labelSub: language === 'ar' ? 'تعريف الأجهزة والاتصال' : 'Device Setup & Connection', icon: Monitor, color: 'text-primary' },
    { id: 'operations' as const, label: language === 'ar' ? 'الإجراءات' : 'Operations', labelSub: language === 'ar' ? 'قراءة وعرض الحركات' : 'Read & View Movements', icon: FileText, color: 'text-primary' },
    { id: 'reports' as const, label: language === 'ar' ? 'التقارير' : 'Reports', labelSub: language === 'ar' ? 'كشوفات الحضور والانصراف' : 'Attendance Reports', icon: BarChart3, color: 'text-primary' },
    { id: 'schedules' as const, label: language === 'ar' ? 'مواعيد العمل' : 'Work Schedules', labelSub: language === 'ar' ? 'الورديات وساعات العمل' : 'Shifts & Work Hours', icon: Clock, color: 'text-primary' },
    { id: 'holidays' as const, label: language === 'ar' ? 'العطلات الرسمية' : 'Holidays', labelSub: language === 'ar' ? 'الإجازات الرسمية والعطلات' : 'Official Holidays', icon: CalendarDays, color: 'text-primary' },
    { id: 'import' as const, label: language === 'ar' ? 'استيراد البيانات' : 'Import Data', labelSub: language === 'ar' ? 'استيراد من ملفات أو أجهزة' : 'Import from Files or Devices', icon: Upload, color: 'text-primary' },
  ];

  if (activeSection === 'home') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
            <Monitor className="w-8 h-8 text-primary" />
            {language === 'ar' ? 'نظام إدارة الحضور والانصراف' : 'Attendance Management System'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {language === 'ar' ? 'نظام متكامل لإدارة أجهزة البصمة والحضور والانصراف والتقارير' : 'Comprehensive system for fingerprint devices, attendance tracking, and reporting'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {sections.map((section) => (
            <Card
              key={section.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-primary/50"
              onClick={() => setActiveSection(section.id)}
            >
              <CardContent className="pt-8 pb-6 flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <section.icon className={`w-8 h-8 ${section.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{section.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{section.labelSub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveSection('home')} className="text-primary hover:underline text-sm font-medium">
          {language === 'ar' ? '← الرئيسية' : '← Home'}
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-semibold">{currentSection?.label}</span>
      </div>

      {activeSection === 'setup' && <DeviceOperationsPanel />}
      {activeSection === 'operations' && <DeviceOperationsPanel showOperations />}
      {activeSection === 'reports' && <AttendanceReportsPanel />}
      {activeSection === 'schedules' && <WorkSchedulesPanel />}
      {activeSection === 'holidays' && <HolidaysPanel />}
      {activeSection === 'import' && <ImportLogsPanel />}
    </div>
  );
}
