import { Calendar, ArrowLeft } from "lucide-react";
import { news } from "./data";

export default function RealEstateNews() {
  return (
    <>
      <section className="pt-40 pb-12">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-12 bg-amber-400" />
            <span className="text-amber-400 text-xs tracking-[0.3em]">الأخبار</span>
            <div className="h-px w-12 bg-amber-400" />
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold mb-5"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            آخر <span className="text-amber-400">المستجدات</span>
          </h1>
          <p className="text-white/65 max-w-2xl mx-auto">
            تابع أحدث أخبارنا، إطلاق مشاريعنا الجديدة، وأبرز إنجازاتنا.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {news.map((n, i) => (
              <article
                key={n.id}
                className={`group rounded-sm overflow-hidden border border-white/10 hover:border-amber-400/40 transition-all bg-[#0c0c0c] ${
                  i === 0 ? "lg:col-span-3 lg:grid lg:grid-cols-2" : ""
                }`}
              >
                <div className={`relative overflow-hidden ${i === 0 ? "h-[400px]" : "h-56"}`}>
                  <img
                    src={n.image}
                    alt={n.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {i === 0 && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-amber-400 text-black text-xs font-semibold rounded-full">
                      مميز
                    </div>
                  )}
                </div>
                <div className="p-6 lg:p-8">
                  <div className="flex items-center gap-2 text-xs text-amber-400 mb-3">
                    <Calendar size={12} /> {n.date}
                  </div>
                  <h3
                    className={`font-bold mb-3 group-hover:text-amber-400 transition-colors ${
                      i === 0 ? "text-3xl" : "text-xl"
                    }`}
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {n.title}
                  </h3>
                  <p className="text-white/65 text-sm leading-loose mb-5">{n.excerpt}</p>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-amber-400 text-sm border-b border-amber-400/40 pb-1 hover:gap-3 transition-all"
                  >
                    اقرأ المزيد <ArrowLeft size={14} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
