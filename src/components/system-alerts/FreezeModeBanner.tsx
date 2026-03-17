import { Snowflake, Lock } from 'lucide-react';

export function FreezeModeBanner() {
  return (
    <div className="fixed inset-0 z-[95] pointer-events-none flex items-start justify-center pt-16">
      <div className="pointer-events-auto bg-sky-600/95 backdrop-blur-sm text-white px-8 py-4 rounded-2xl shadow-2xl border border-sky-400/30 flex items-center gap-4 max-w-2xl mx-4 animate-fade-in">
        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Snowflake className="w-7 h-7 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Lock className="w-4 h-4" />
            النظام في وضع التجميد الشامل
          </h3>
          <p className="text-sm text-sky-100 mt-1">
            جميع التغييرات محظورة حالياً. لا يمكن إجراء أي تعديلات على النظام حتى يتم إلغاء التجميد من قبل المسؤول الرئيسي.
          </p>
        </div>
      </div>
    </div>
  );
}
