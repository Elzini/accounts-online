import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Settings, FileText, Monitor, Users, Clock, Upload, Download, CalendarDays, BarChart3, Sun, Moon, Sunrise } from 'lucide-react';
import { DeviceOperationsPanel } from './DeviceOperationsPanel';
import { WorkSchedulesPanel } from './WorkSchedulesPanel';
import { HolidaysPanel } from './HolidaysPanel';
import { AttendanceReportsPanel } from './AttendanceReportsPanel';
import { ImportLogsPanel } from './ImportLogsPanel';

type ActiveSection = 'home' | 'setup' | 'operations' | 'reports' | 'users' | 'import' | 'schedules' | 'holidays';

export function AttendanceManagementHub() {
  const { language } = useLanguage();
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return { text: language === 'ar' ? 'صباح الخير' : 'Good Morning', icon: Sunrise };
    if (hour >= 12 && hour < 18) return { text: language === 'ar' ? 'مساء الخير' : 'Good Afternoon', icon: Sun };
    return { text: language === 'ar' ? 'مساء الخير' : 'Good Evening', icon: Moon };
  };

  const greeting = getGreeting();
  const timeStr = currentTime.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = currentTime.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const sections = [
    { id: 'setup' as const, label: language === 'ar' ? 'التجهيز' : 'Setup', labelSub: language === 'ar' ? 'تعريف الأجهزة والاتصال' : 'Device Setup & Connection', icon: Monitor, gradient: 'from-blue-500 to-blue-600' },
    { id: 'operations' as const, label: language === 'ar' ? 'الإجراءات' : 'Operations', labelSub: language === 'ar' ? 'قراءة وعرض الحركات' : 'Read & View Movements', icon: FileText, gradient: 'from-emerald-500 to-emerald-600' },
    { id: 'reports' as const, label: language === 'ar' ? 'التقارير' : 'Reports', labelSub: language === 'ar' ? 'كشوفات الحضور والانصراف' : 'Attendance Reports', icon: BarChart3, gradient: 'from-violet-500 to-violet-600' },
    { id: 'schedules' as const, label: language === 'ar' ? 'مواعيد العمل' : 'Work Schedules', labelSub: language === 'ar' ? 'الورديات وساعات العمل' : 'Shifts & Work Hours', icon: Clock, gradient: 'from-amber-500 to-amber-600' },
    { id: 'holidays' as const, label: language === 'ar' ? 'العطلات الرسمية' : 'Holidays', labelSub: language === 'ar' ? 'الإجازات الرسمية والعطلات' : 'Official Holidays', icon: CalendarDays, gradient: 'from-rose-500 to-rose-600' },
    { id: 'import' as const, label: language === 'ar' ? 'استيراد البيانات' : 'Import Data', labelSub: language === 'ar' ? 'استيراد من ملفات أو أجهزة' : 'Import from Files or Devices', icon: Upload, gradient: 'from-cyan-500 to-cyan-600' },
  ];

  if (activeSection === 'home') {
    return (
      <div className="space-y-6">
        {/* Header with time & date */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-l from-sidebar to-sidebar-accent p-5 sm:p-6">
          <div className="absolute top-0 left-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-36 h-36 bg-info/20 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
                <Monitor className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  {language === 'ar' ? 'نظام إدارة الحضور والانصراف' : 'Attendance Management System'}
                  <greeting.icon className="w-5 h-5 text-warning" />
                </h1>
                <p className="text-white/60 text-sm mt-1">
                  {language === 'ar' ? 'نظام متكامل لإدارة أجهزة البصمة والحضور والتقارير' : 'Comprehensive fingerprint & attendance system'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <div className="flex items-center gap-1.5 text-white/80 text-xs mb-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'الوقت' : 'Time'}</span>
                </div>
                <p className="text-white font-bold text-lg tabular-nums">{timeStr}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <div className="flex items-center gap-1.5 text-white/80 text-xs mb-0.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'التاريخ' : 'Date'}</span>
                </div>
                <p className="text-white font-semibold text-sm">{dateStr}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Module cards grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {sections.map((section) => (
            <Card
              key={section.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.03] border hover:border-primary/30 group"
              onClick={() => setActiveSection(section.id)}
            >
              <CardContent className="pt-6 pb-5 flex flex-col items-center text-center space-y-3">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <section.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{section.label}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{section.labelSub}</p>
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