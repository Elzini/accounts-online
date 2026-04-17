import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, Building2, Home, Award, Users, MapPin, Calendar } from "lucide-react";
import heroVilla from "@/assets/realestate/hero-villa.jpg";
import interior from "@/assets/realestate/interior-1.jpg";
import { projects, partners } from "./data";

const stats = [
  { value: "+12", label: "مشروع منجز", icon: Building2 },
  { value: "+850", label: "وحدة سكنية", icon: Home },
  { value: "+1,200", label: "عميل سعيد", icon: Users },
  { value: "+15", label: "جائزة وتكريم", icon: Award },
];

export default function RealEstateHome() {
  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroVilla}
            alt="فيلا فاخرة من أفق الفرص"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/95 via-black/70 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
        </div>

        <div className="relative z-10 container mx-auto px-6 pt-32">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-amber-400" />
              <span className="text-amber-400 text-xs tracking-[0.3em]">EST. 2015</span>
            </div>
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-8"
              style={{ fontFamily: "'Playfair Display', 'Cairo', serif" }}
            >
              نُشيّد <span className="text-amber-400">إرثاً</span>
              <br />
              يليق بالأجيال.
            </h1>
            <p className="text-lg md:text-xl text-white/75 leading-loose mb-10 max-w-xl">
              في أفق الفرص الاستثمارية، نُعيد صياغة مفهوم الفخامة عبر فلل ومجمعات سكنية متفردة، تجمع الأناقة المعمارية بالحياة العصرية.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <Link
                to="/realestate/projects"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-amber-400 text-black font-semibold rounded-full hover:bg-amber-300 transition-all"
              >
                استعرض مشاريعنا
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/realestate/contact"
                className="inline-flex items-center gap-2 px-8 py-4 border border-white/25 text-white font-medium rounded-full hover:border-amber-400 hover:text-amber-400 transition-all"
              >
                احجز استشارة مجانية
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/50 text-xs">
          <span className="mb-2 tracking-[0.3em]">SCROLL</span>
          <ChevronDown size={20} className="animate-bounce" />
        </div>
      </section>

      {/* STATS */}
      <section className="py-24 border-y border-amber-500/10 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center group">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-amber-400/30 mb-5 group-hover:border-amber-400 group-hover:bg-amber-400/10 transition-all">
                  <s.icon size={22} className="text-amber-400" />
                </div>
                <div
                  className="text-4xl md:text-5xl font-bold text-white mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {s.value}
                </div>
                <div className="text-white/60 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT TEASER */}
      <section className="py-28">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-10 bg-amber-400" />
                <span className="text-amber-400 text-xs tracking-[0.3em]">من نحن</span>
              </div>
              <h2
                className="text-4xl md:text-5xl font-bold leading-tight mb-6"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                رؤية معمارية،
                <br />
                <span className="text-amber-400">دقة تنفيذ.</span>
              </h2>
              <p className="text-white/70 leading-loose mb-5">
                منذ تأسيسها عام 2015، نجحت أفق الفرص الاستثمارية في إنشاء مجموعة من أرقى المشاريع السكنية في المملكة. نؤمن بأن المنزل ليس مجرد مكان للسكن، بل بصمة حياة وانعكاس لهوية أصحابه.
              </p>
              <p className="text-white/60 leading-loose mb-8">
                نختار مواقعنا بعناية، ونعمل مع نخبة من المهندسين المعماريين والمصممين العالميين لنقدم تجربة سكن استثنائية في كل تفصيل.
              </p>
              <Link
                to="/realestate/about"
                className="inline-flex items-center gap-2 text-amber-400 hover:gap-3 transition-all border-b border-amber-400/40 pb-1"
              >
                اكتشف قصتنا
                <ArrowLeft size={16} />
              </Link>
            </div>
            <div className="relative">
              <img
                src={interior}
                alt="تصميم داخلي فاخر"
                loading="lazy"
                className="w-full h-[500px] object-cover rounded-sm"
              />
              <div className="absolute -bottom-6 -right-6 bg-amber-400 text-black p-6 max-w-[200px]">
                <div className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                  +10
                </div>
                <div className="text-xs">سنوات من الخبرة في التطوير العقاري</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section className="py-28 bg-[#0c0c0c]">
        <div className="container mx-auto px-6">
          <div className="flex items-end justify-between mb-14 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-10 bg-amber-400" />
                <span className="text-amber-400 text-xs tracking-[0.3em]">مشاريعنا</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                مشاريع <span className="text-amber-400">مختارة</span>
              </h2>
            </div>
            <Link
              to="/realestate/projects"
              className="text-white/70 hover:text-amber-400 text-sm flex items-center gap-2"
            >
              عرض الكل <ArrowLeft size={14} />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {projects.map((p) => (
              <Link
                to={`/realestate/projects`}
                key={p.id}
                className="group relative overflow-hidden rounded-sm h-[460px]"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute top-4 right-4 px-3 py-1 bg-amber-400 text-black text-xs font-semibold rounded-full">
                  {p.status}
                </div>
                <div className="absolute bottom-0 inset-x-0 p-6">
                  <div className="flex items-center gap-2 text-amber-400 text-xs mb-2">
                    <MapPin size={12} />
                    {p.location}
                  </div>
                  <h3
                    className="text-2xl font-bold mb-2 group-hover:text-amber-400 transition-colors"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {p.name}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>{p.type}</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {p.deliveryDate}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="py-20 border-t border-amber-500/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-amber-400 text-xs tracking-[0.3em]">شركاء النجاح</span>
            <h3 className="text-2xl mt-3 text-white/80" style={{ fontFamily: "'Playfair Display', serif" }}>
              نفخر بشراكاتنا مع نخبة المؤسسات
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {partners.map((p) => (
              <div
                key={p}
                className="h-20 rounded-sm border border-white/10 flex items-center justify-center text-center px-4 text-white/50 text-xs hover:border-amber-400/40 hover:text-amber-400 transition-all"
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="relative overflow-hidden rounded-sm border border-amber-400/20 p-12 md:p-20 text-center bg-gradient-to-br from-amber-500/5 to-transparent">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "radial-gradient(circle at 30% 20%, rgba(251,191,36,0.3), transparent 50%)"
            }} />
            <div className="relative z-10">
              <h2
                className="text-4xl md:text-6xl font-bold mb-6"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                ابدأ رحلتك نحو
                <br />
                <span className="text-amber-400">منزل أحلامك.</span>
              </h2>
              <p className="text-white/70 max-w-xl mx-auto mb-8">
                تواصل مع فريق المبيعات للحصول على استشارة مجانية وعرض مفصل عن الوحدات المتاحة وخيارات التمويل.
              </p>
              <Link
                to="/realestate/contact"
                className="inline-flex items-center gap-3 px-10 py-4 bg-amber-400 text-black font-semibold rounded-full hover:bg-amber-300 transition-all"
              >
                تواصل الآن
                <ArrowLeft size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
