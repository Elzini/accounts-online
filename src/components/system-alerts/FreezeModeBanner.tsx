import { Snowflake, Lock, ShieldAlert } from 'lucide-react';

export function FreezeModeBanner() {
  return (
    <div className="fixed inset-0 z-[95] pointer-events-none">
      {/* Subtle frosted overlay */}
      <div className="absolute inset-0 bg-sky-950/5 backdrop-blur-[1px]" />
      
      {/* Main banner */}
      <div className="absolute top-16 left-0 right-0 flex justify-center px-4 pointer-events-auto">
        <div className="relative overflow-hidden bg-gradient-to-l from-sky-700 via-blue-600 to-indigo-700 text-white px-8 py-5 rounded-2xl shadow-2xl shadow-blue-900/30 border border-sky-400/20 flex items-center gap-5 max-w-3xl w-full">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_20%_50%,white_1px,transparent_1px)] bg-[length:16px_16px]" />
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-sky-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl" />
          
          {/* Icon */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <Snowflake className="w-8 h-8 animate-spin text-sky-200" style={{ animationDuration: '4s' }} />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-sky-700">
              <Lock className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          
          {/* Content */}
          <div className="relative flex-1">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4 text-sky-300" />
              <h3 className="font-bold text-lg">النظام في وضع التجميد الشامل</h3>
            </div>
            <p className="text-sm text-sky-100/80 leading-relaxed">
              جميع التغييرات محظورة حالياً — لا يمكن إجراء أي تعديلات على الكود أو قاعدة البيانات أو الإعدادات الحساسة حتى يتم إلغاء التجميد من قبل المسؤول الرئيسي.
            </p>
          </div>
          
          {/* Decorative frost line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-l from-transparent via-sky-300/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}
