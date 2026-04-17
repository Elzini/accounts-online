import { useState } from "react";
import { Bed, Bath, Maximize, X } from "lucide-react";
import { units } from "./data";

const formatPrice = (n: number) => new Intl.NumberFormat("ar-SA").format(n);

export default function RealEstateUnits() {
  const [filter, setFilter] = useState<string>("الكل");
  const [selected, setSelected] = useState<typeof units[0] | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const projects = ["الكل", ...Array.from(new Set(units.map(u => u.project)))];
  const filtered = filter === "الكل" ? units : units.filter(u => u.project === filter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`تم استلام طلب حجز الوحدة ${selected?.id} بنجاح. سنتواصل معك قريباً.`);
    setSelected(null);
    setForm({ name: "", phone: "", email: "" });
  };

  return (
    <>
      <section className="pt-40 pb-12">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-12 bg-amber-400" />
            <span className="text-amber-400 text-xs tracking-[0.3em]">الوحدات المتاحة</span>
            <div className="h-px w-12 bg-amber-400" />
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold mb-5"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            وحدات <span className="text-amber-400">جاهزة</span> للحجز
          </h1>
          <p className="text-white/65 max-w-2xl mx-auto">
            تصفح الوحدات المتاحة من مشاريعنا واحجز وحدتك الآن مع شروط وتمويل ميسر.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {projects.map((p) => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={`px-5 py-2 text-sm rounded-full border transition-all ${
                  filter === p
                    ? "bg-amber-400 text-black border-amber-400"
                    : "border-white/15 text-white/70 hover:border-amber-400/50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="group border border-white/10 rounded-sm overflow-hidden hover:border-amber-400/40 transition-all"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={u.image}
                    alt={u.type}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        u.status === "متاحة"
                          ? "bg-emerald-500 text-white"
                          : u.status === "محجوزة"
                          ? "bg-red-500/90 text-white"
                          : "bg-amber-400 text-black"
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>
                </div>
                <div className="p-6 bg-[#0c0c0c]">
                  <div className="text-xs text-amber-400 mb-2">{u.project}</div>
                  <h3
                    className="text-xl font-bold mb-4"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {u.type}
                  </h3>
                  <div className="grid grid-cols-3 gap-2 mb-5 text-xs text-white/70">
                    <div className="flex flex-col items-center gap-1 py-2 bg-white/5 rounded">
                      <Bed size={14} className="text-amber-400" />
                      {u.bedrooms} غرف
                    </div>
                    <div className="flex flex-col items-center gap-1 py-2 bg-white/5 rounded">
                      <Bath size={14} className="text-amber-400" />
                      {u.bathrooms} حمام
                    </div>
                    <div className="flex flex-col items-center gap-1 py-2 bg-white/5 rounded">
                      <Maximize size={14} className="text-amber-400" />
                      {u.area} م²
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <div className="text-[10px] text-white/50">السعر يبدأ من</div>
                      <div
                        className="text-xl font-bold text-amber-400"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {formatPrice(u.price)} ر.س
                      </div>
                    </div>
                    <button
                      onClick={() => setSelected(u)}
                      disabled={u.status !== "متاحة"}
                      className="px-4 py-2 bg-amber-400 text-black text-sm font-semibold rounded-full hover:bg-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      احجز
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0c0c] border border-amber-400/30 rounded-sm max-w-md w-full p-8 relative">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 left-4 text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
            <div className="text-amber-400 text-xs tracking-[0.3em] mb-2">طلب حجز</div>
            <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              {selected.type}
            </h3>
            <p className="text-white/60 text-sm mb-6">{selected.project}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                required
                placeholder="الاسم الكامل"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-amber-400 focus:outline-none"
              />
              <input
                type="tel"
                required
                placeholder="رقم الجوال"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-amber-400 focus:outline-none"
              />
              <input
                type="email"
                placeholder="البريد الإلكتروني (اختياري)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-3 bg-amber-400 text-black font-semibold rounded-full hover:bg-amber-300 transition-colors"
              >
                تأكيد طلب الحجز
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
