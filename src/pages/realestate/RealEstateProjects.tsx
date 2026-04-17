import { useState } from "react";
import { MapPin, Calendar, Home, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { projects } from "./data";

const filters = ["جميع المشاريع", "متاح للبيع", "قيد التنفيذ", "قريباً"];

export default function RealEstateProjects() {
  const [filter, setFilter] = useState("جميع المشاريع");

  const filtered = filter === "جميع المشاريع" ? projects : projects.filter(p => p.status === filter);

  return (
    <>
      <section className="pt-40 pb-12">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-12 bg-amber-400" />
            <span className="text-amber-400 text-xs tracking-[0.3em]">المشاريع</span>
            <div className="h-px w-12 bg-amber-400" />
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold mb-5"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            مشاريع <span className="text-amber-400">استثنائية</span>
          </h1>
          <p className="text-white/65 max-w-2xl mx-auto">
            استكشف مجموعتنا الحصرية من المشاريع السكنية الفاخرة في أرقى أحياء المملكة.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 text-sm rounded-full border transition-all ${
                  filter === f
                    ? "bg-amber-400 text-black border-amber-400"
                    : "border-white/15 text-white/70 hover:border-amber-400/50 hover:text-amber-400"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-sm border border-white/10 hover:border-amber-400/40 transition-all"
              >
                <div className="relative h-[320px] overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute top-4 right-4 px-3 py-1 bg-amber-400 text-black text-xs font-semibold rounded-full">
                    {p.status}
                  </div>
                </div>
                <div className="p-6 bg-[#0c0c0c]">
                  <div className="flex items-center gap-2 text-amber-400 text-xs mb-3">
                    <MapPin size={12} /> {p.location}
                  </div>
                  <h3
                    className="text-2xl font-bold mb-3 group-hover:text-amber-400 transition-colors"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {p.name}
                  </h3>
                  <p className="text-white/65 text-sm leading-loose mb-5">{p.description}</p>
                  <div className="flex items-center justify-between pt-5 border-t border-white/10 text-xs text-white/60">
                    <span className="flex items-center gap-1">
                      <Home size={12} className="text-amber-400" /> {p.units} وحدة
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-amber-400" /> {p.deliveryDate}
                    </span>
                    <Link
                      to="/realestate/units"
                      className="text-amber-400 flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      الوحدات <ArrowLeft size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
