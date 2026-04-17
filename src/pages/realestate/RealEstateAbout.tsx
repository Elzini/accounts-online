import { Award, Target, Eye, Heart, CheckCircle2 } from "lucide-react";
import aboutBg from "@/assets/realestate/about-bg.jpg";
import interior from "@/assets/realestate/interior-1.jpg";

const values = [
  { icon: Target, title: "الجودة", desc: "نلتزم بأعلى معايير الجودة في كل تفصيل من تفاصيل مشاريعنا." },
  { icon: Eye, title: "الرؤية", desc: "نستشرف المستقبل ونصمم بيوتاً تواكب احتياجات الأجيال القادمة." },
  { icon: Heart, title: "الشغف", desc: "نحب ما نفعل، ويظهر ذلك في إتقان كل مشروع نطلقه." },
  { icon: Award, title: "التميز", desc: "نسعى دوماً لتقديم تجربة استثنائية تتجاوز توقعات عملائنا." },
];

const milestones = [
  { year: "2015", text: "تأسيس الشركة برأس مال مدفوع 50 مليون ريال" },
  { year: "2017", text: "إطلاق أول مشروع سكني في الرياض - أفق الورود" },
  { year: "2019", text: "التوسع في 3 مدن جديدة - جدة، الدمام، الخبر" },
  { year: "2022", text: "افتتاح مكتب التصميم الداخلي والاستشارات" },
  { year: "2024", text: "الحصول على جائزة أفضل مطور عقاري ناشئ" },
  { year: "2026", text: "إطلاق المرحلة الثانية والثالثة من مشاريعنا الكبرى" },
];

export default function RealEstateAbout() {
  return (
    <>
      {/* HERO */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img src={aboutBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
        </div>
        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12 bg-amber-400" />
            <span className="text-amber-400 text-xs tracking-[0.3em]">من نحن</span>
            <div className="h-px w-12 bg-amber-400" />
          </div>
          <h1
            className="text-5xl md:text-7xl font-bold mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            قصة <span className="text-amber-400">شغف</span> ورؤية
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-loose">
            من حلم بسيط إلى علامة رائدة في التطوير العقاري السعودي، نروي قصتنا من خلال المشاريع التي نبنيها والعائلات التي نسعدها.
          </p>
        </div>
      </section>

      {/* STORY */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-amber-400 text-xs tracking-[0.3em]">قصتنا</span>
              <h2
                className="text-4xl md:text-5xl font-bold mt-4 mb-8"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                من فكرة إلى واقع <span className="text-amber-400">ملموس.</span>
              </h2>
              <div className="space-y-5 text-white/70 leading-loose">
                <p>
                  انطلقت أفق الفرص الاستثمارية في عام 2015 برؤية واضحة: تقديم مفهوم جديد للسكن الفاخر في المملكة العربية السعودية، يجمع بين الأصالة المعمارية والابتكار العصري.
                </p>
                <p>
                  خلال أكثر من عقد من العمل، نجحنا في تنفيذ أكثر من 12 مشروعاً متميزاً، شملت فلل سكنية ومجمعات تاون هاوس، استفاد منها أكثر من 1,200 عائلة سعودية.
                </p>
                <p>
                  ما يميزنا ليس فقط ما نبنيه، بل كيف نبنيه. نختار مواقعنا بعناية، ونعمل مع نخبة من المهندسين والمصممين، ونلتزم بأعلى معايير الجودة في كل مرحلة.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-10">
                {[
                  "تصميم معماري عالمي",
                  "مواد بناء فاخرة",
                  "تشطيبات راقية",
                  "ضمان شامل 10 سنوات",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle2 size={16} className="text-amber-400" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src={interior}
                alt="مشروع أفق"
                loading="lazy"
                className="w-full h-[600px] object-cover rounded-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-24 bg-[#0c0c0c]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-amber-400 text-xs tracking-[0.3em]">قيمنا</span>
            <h2
              className="text-4xl md:text-5xl font-bold mt-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              ما نؤمن به
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="p-8 border border-white/10 rounded-sm hover:border-amber-400/40 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-amber-400/10 flex items-center justify-center mb-5 group-hover:bg-amber-400 transition-colors">
                  <v.icon size={20} className="text-amber-400 group-hover:text-black" />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {v.title}
                </h3>
                <p className="text-white/60 text-sm leading-loose">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-amber-400 text-xs tracking-[0.3em]">مسيرتنا</span>
            <h2
              className="text-4xl md:text-5xl font-bold mt-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              محطات <span className="text-amber-400">الإنجاز</span>
            </h2>
          </div>
          <div className="max-w-3xl mx-auto relative">
            <div className="absolute right-[15px] md:right-1/2 md:translate-x-px top-0 bottom-0 w-px bg-amber-400/20" />
            {milestones.map((m, i) => (
              <div
                key={m.year}
                className={`relative flex md:items-center mb-12 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <div className="absolute right-2 md:right-1/2 md:translate-x-1/2 w-3 h-3 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
                <div className={`pr-12 md:px-12 ${i % 2 === 0 ? "md:text-left md:pr-0" : "md:text-right md:pl-0"} md:w-1/2`}>
                  <div className="text-2xl font-bold text-amber-400 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {m.year}
                  </div>
                  <p className="text-white/70 text-sm leading-loose">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
