import ramadanCar from '@/assets/ramadan-car.jpg';

export default function RamadanGreeting() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(220,30%,8%)] p-4">
      <div
        className="relative w-full max-w-md sm:max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ aspectRatio: '3/4' }}
      >
        {/* Background Car Image */}
        <img
          src={ramadanCar}
          alt="Ramadan Car"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-between h-full px-6 py-8" dir="rtl">
          {/* Top Section - Ramadan Kareem */}
          <div className="text-center space-y-3 pt-2">
            <p className="text-xl">🌙✨</p>
            <h1
              className="text-4xl sm:text-5xl font-bold"
              style={{
                color: '#F5D06E',
                textShadow: '0 2px 20px rgba(245,208,110,0.6), 0 4px 40px rgba(0,0,0,0.8)',
                fontFamily: 'serif',
              }}
            >
              رمضان كريم
            </h1>
            <p
              className="text-sm sm:text-base leading-relaxed max-w-sm mx-auto"
              style={{ color: '#E8D9B0', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
            >
              مبارك عليكم الشهر، وتقبّل الله طاعتكم
            </p>
          </div>

          {/* Middle Section - Greeting Message */}
          <div className="text-center space-y-3 flex-1 flex flex-col justify-center">
            <p
              className="text-base sm:text-lg font-bold"
              style={{ color: '#F5D06E', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
            >
              إدارة شركة النمار كار
            </p>
            <p
              className="text-sm sm:text-base leading-relaxed max-w-sm mx-auto"
              style={{ color: '#E8D9B0', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
            >
              تهنئكم بحلول شهر رمضان المبارك
            </p>
            <p
              className="text-xs sm:text-sm leading-relaxed max-w-xs mx-auto"
              style={{ color: '#D4C9A8', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
            >
              نسأل الله أن يعيده علينا وعليكم بالخير واليمن والبركات، وأن يمنحكم الصحة والسعادة والسلامة
            </p>
            <p className="text-lg pt-1" style={{ color: '#F5D06E', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
              كل عام وأنتم بخير 🌙🤲
            </p>
          </div>

          {/* Bottom Section - Company Branding */}
          <div className="text-center pb-2">
            <div className="border-t border-[#F5D06E]/40 pt-4 px-8 inline-block">
              <p className="text-2xl font-black" style={{ color: '#F5D06E', textShadow: '0 2px 15px rgba(245,208,110,0.4)' }}>
                شركة النمار كار
              </p>
              <p className="text-xs tracking-[0.4em] uppercase mt-1" style={{ color: '#D4C9A8' }}>
                NAMAR CAR COMPANY
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
