import carsImg from '@/assets/cars-lineup.jpg';

export default function RamadanGreeting() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div
        className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)' }}
        dir="rtl"
      >
        {/* Header - Company Logo */}
        <div
          className="relative py-5 px-6 text-center"
          style={{
            background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
            borderBottom: '3px solid #c0392b',
          }}
        >
          {/* Car silhouette accent */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-40 h-8">
            <svg viewBox="0 0 200 40" className="w-full h-full">
              <path
                d="M20,35 Q50,5 100,5 Q150,5 180,35"
                fill="none"
                stroke="#c0392b"
                strokeWidth="3"
              />
              <path
                d="M30,35 Q55,10 100,10 Q145,10 170,35"
                fill="none"
                stroke="#e74c3c"
                strokeWidth="1.5"
                opacity="0.5"
              />
            </svg>
          </div>
          <h1
            className="text-3xl font-black mt-6"
            style={{ color: '#F5D06E', textShadow: '0 2px 10px rgba(245,208,110,0.3)' }}
          >
            النمار كار
          </h1>
        </div>

        {/* Greeting Text Section */}
        <div
          className="px-6 py-5 text-center space-y-3"
          style={{
            background: 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(20,20,20,0.95))',
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg">🌙</span>
            <p className="text-base font-bold" style={{ color: '#F5D06E' }}>
              مبارك عليكم الشهر الكريم، وتقبّل الله طاعتكم
            </p>
          </div>

          <p className="text-lg font-black" style={{ color: '#ffffff' }}>
            إدارة شركة النمار كار
          </p>

          <p className="text-sm leading-relaxed" style={{ color: '#F5D06E' }}>
            تهنئكم بحلول شهر رمضان المبارك.
          </p>

          <p className="text-sm leading-relaxed" style={{ color: '#e0d5b8' }}>
            نسأل الله أن يجعله خيراً وبركة عليكم وعلى أحبابكم.
          </p>

          {/* Company stamp area */}
          <div className="py-2">
            <p className="text-xs" style={{ color: '#999' }}>0540669991</p>
          </div>
        </div>

        {/* Cars Image */}
        <div className="relative">
          <img
            src={carsImg}
            alt="سيارات النمار كار"
            className="w-full h-56 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        </div>

        {/* Contact Section */}
        <div style={{ background: '#1a1a1a' }}>
          {/* Contact Header */}
          <div
            className="text-center py-2"
            style={{
              background: 'linear-gradient(90deg, #c0392b, #e74c3c, #c0392b)',
            }}
          >
            <p className="text-sm font-bold text-white">للتواصل / واتساب</p>
          </div>

          {/* Contact Numbers */}
          <div className="px-6 py-3 space-y-2">
            {[
              { name: 'أبو تامر', phone: '0555882134' },
              { name: 'مبيعات', phone: '0500337444' },
              { name: 'عبدالله', phone: '0591786606' },
              { name: 'سعيد', phone: '0561634736' },
            ].map((contact, i) => (
              <div key={i} className="flex items-center justify-center gap-3">
                <span className="text-sm font-bold" style={{ color: '#e0d5b8' }}>
                  {contact.name}
                </span>
                <span className="text-xs" style={{ color: '#999' }}>:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-green-500 text-sm">📱</span>
                  <span className="text-sm font-mono" style={{ color: '#ffffff' }}>
                    {contact.phone}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Complaints Section */}
          <div
            className="text-center py-1.5 mx-4"
            style={{
              background: 'linear-gradient(90deg, transparent, #c0392b, transparent)',
              borderRadius: '4px',
            }}
          >
            <p className="text-xs font-bold text-white">للشكوى والاقتراحات</p>
          </div>

          <div className="px-6 py-3 space-y-1.5 text-center">
            {['0555059003', '0530334421'].map((phone, i) => (
              <div key={i} className="flex items-center justify-center gap-2">
                <span className="text-green-500 text-sm">📱</span>
                <span className="text-lg font-mono font-bold" style={{ color: '#ffffff' }}>
                  {phone}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="py-3 text-center"
          style={{ background: '#111', borderTop: '2px solid #c0392b' }}
        >
          <p className="text-xs" style={{ color: '#666' }}>
            شركة النمار كار | NAMAR CAR COMPANY
          </p>
        </div>
      </div>
    </div>
  );
}
