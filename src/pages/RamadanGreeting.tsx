import ramadanBg from '@/assets/ramadan-bg-clean.jpg';

export default function RamadanGreeting() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(220,30%,10%)] p-4">
      <div
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ aspectRatio: '16/9' }}
      >
        {/* Background Image */}
        <img
          src={ramadanBg}
          alt="Ramadan Background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black/70" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 py-8" dir="rtl">
          {/* Emoji Header */}
          <p className="text-2xl sm:text-3xl mb-2">🌙✨</p>

          {/* Main Title */}
          <h1
            className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4"
            style={{
              color: '#F5D06E',
              textShadow: '0 2px 20px rgba(245,208,110,0.5), 0 4px 40px rgba(0,0,0,0.7)',
              fontFamily: 'serif',
            }}
          >
            رمضان كريم
          </h1>

          {/* Subtitle */}
          <p
            className="text-base sm:text-lg lg:text-xl mb-6 max-w-2xl leading-relaxed"
            style={{
              color: '#E8D9B0',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            }}
          >
            تتقدم شركة <span className="font-bold text-[#F5D06E]">النمار كار</span> وإدارتها بأحر التهاني وأطيب الأماني بمناسبة حلول شهر رمضان الكريم
          </p>

          <p
            className="text-sm sm:text-base lg:text-lg max-w-xl leading-relaxed mb-6"
            style={{
              color: '#D4C9A8',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            }}
          >
            نسأل الله أن يعيده علينا وعليكم بالخير واليمن والبركات، وأن يمنحكم الصحة والسعادة والسلامة في كل أيامكم
          </p>

          {/* Footer */}
          <div className="mt-2">
            <p className="text-lg sm:text-2xl mb-1" style={{ color: '#F5D06E', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              كل عام وأنتم بخير 🌙🤲
            </p>
            <div className="mt-4 border-t border-[#F5D06E]/30 pt-3 inline-block px-8">
              <p className="text-xl sm:text-2xl font-bold" style={{ color: '#F5D06E' }}>
                النمار كار
              </p>
              <p className="text-xs sm:text-sm tracking-[0.3em] uppercase" style={{ color: '#D4C9A8' }}>
                AL-NIMAR CAR
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
