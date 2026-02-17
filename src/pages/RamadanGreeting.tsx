import cardBg from '@/assets/namar-card-bg.jpeg';

export default function RamadanGreeting() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl shadow-2xl"
        dir="rtl"
      >
        {/* Background Image */}
        <img
          src={cardBg}
          alt="بطاقة النمار كار"
          className="w-full h-auto block"
        />

        {/* Ramadan Greeting Overlay - positioned over the showroom/cars area */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ top: '28%', bottom: '38%' }}
        >
          {/* Semi-transparent backdrop */}
          <div
            className="px-6 py-5 rounded-xl text-center mx-4"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.85), rgba(20,0,0,0.80))',
              border: '2px solid rgba(245,208,110,0.4)',
              boxShadow: '0 0 30px rgba(0,0,0,0.6), inset 0 0 20px rgba(245,208,110,0.05)',
            }}
          >
            {/* Crescent */}
            <div className="text-4xl mb-2">🌙</div>

            <h2
              className="text-2xl font-black mb-2"
              style={{
                color: '#F5D06E',
                textShadow: '0 2px 10px rgba(245,208,110,0.4)',
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              رمضان كريم
            </h2>

            <p
              className="text-sm font-bold leading-relaxed mb-2"
              style={{ color: '#ffffff', fontFamily: "'Cairo', sans-serif" }}
            >
              مبارك عليكم الشهر الكريم
              <br />
              وتقبّل الله طاعتكم
            </p>

            <div
              className="w-16 h-0.5 mx-auto my-2"
              style={{ background: 'linear-gradient(90deg, transparent, #c0392b, transparent)' }}
            />

            <p
              className="text-xs leading-relaxed"
              style={{ color: '#e0d5b8', fontFamily: "'Cairo', sans-serif" }}
            >
              إدارة شركة النمار كار تهنئكم
              <br />
              بحلول شهر رمضان المبارك
            </p>

            <p
              className="text-xs mt-2"
              style={{ color: '#999', fontFamily: "'Cairo', sans-serif" }}
            >
              نسأل الله أن يجعله خيراً وبركة
              <br />
              عليكم وعلى أحبابكم
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
