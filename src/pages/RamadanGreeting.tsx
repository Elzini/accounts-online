import namarCard from '@/assets/namar-car-ramadan.png';

export default function RamadanGreeting() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(0,0%,5%)] p-4">
      <div className="w-full max-w-lg rounded-xl overflow-hidden shadow-2xl">
        <img
          src={namarCard}
          alt="تهنئة رمضان - شركة النمار كار"
          className="w-full h-auto object-contain"
        />
      </div>
    </div>
  );
}
