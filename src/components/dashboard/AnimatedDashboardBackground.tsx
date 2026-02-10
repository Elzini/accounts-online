import { useEffect, useRef } from 'react';

/**
 * Lightweight animated gradient mesh background for the dashboard.
 * Uses CSS animations only – no canvas or heavy deps.
 */
export function AnimatedDashboardBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-background" />

      {/* Animated blobs */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04] dark:opacity-[0.06] blur-[100px]"
        style={{
          background: 'hsl(221 83% 53%)',
          top: '10%',
          right: '-5%',
          animation: 'blob-float 20s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.04] dark:opacity-[0.06] blur-[100px]"
        style={{
          background: 'hsl(262 83% 58%)',
          bottom: '15%',
          left: '-5%',
          animation: 'blob-float 25s ease-in-out infinite reverse',
        }}
      />
      <div
        className="absolute w-[350px] h-[350px] rounded-full opacity-[0.03] dark:opacity-[0.05] blur-[80px]"
        style={{
          background: 'hsl(160 84% 39%)',
          top: '50%',
          left: '30%',
          animation: 'blob-float 30s ease-in-out infinite 5s',
        }}
      />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <style>{`
        @keyframes blob-float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(30px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.95);
          }
          75% {
            transform: translate(40px, 30px) scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
