import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";

export default function RealEstateContact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    }, 3000);
  };

  return (
    <>
      <section className="pt-40 pb-12">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-12 bg-amber-400" />
            <span className="text-amber-400 text-xs tracking-[0.3em]">تواصل معنا</span>
            <div className="h-px w-12 bg-amber-400" />
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold mb-5"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            دعنا <span className="text-amber-400">نتحدث</span>
          </h1>
          <p className="text-white/65 max-w-2xl mx-auto">
            فريقنا متواجد للإجابة على استفساراتك وتقديم استشارة مجانية لمساعدتك في اختيار الوحدة المثالية.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            {[
              { icon: MapPin, title: "العنوان", value: "الرياض، حي الياسمين، طريق الملك فهد" },
              { icon: Phone, title: "الهاتف", value: "+966 50 000 0000" },
              { icon: Mail, title: "البريد الإلكتروني", value: "info@afaq-realestate.sa" },
            ].map((c, i) => (
              <div
                key={i}
                className="p-8 border border-white/10 rounded-sm hover:border-amber-400/40 transition-all text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-400/10 mb-4">
                  <c.icon size={20} className="text-amber-400" />
                </div>
                <div className="text-amber-400 text-xs tracking-[0.25em] mb-2">{c.title}</div>
                <div className="text-white/80 text-sm">{c.value}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            <div className="border border-white/10 rounded-sm p-8 lg:p-10 bg-[#0c0c0c]">
              <h2
                className="text-3xl font-bold mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                أرسل <span className="text-amber-400">رسالتك</span>
              </h2>
              <p className="text-white/60 text-sm mb-8">سنتواصل معك خلال 24 ساعة عمل.</p>

              {sent ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-sm p-6 text-center">
                  <div className="text-emerald-400 font-bold mb-2">تم إرسال رسالتك بنجاح ✓</div>
                  <div className="text-white/70 text-sm">شكراً لتواصلك معنا، سنرد عليك قريباً.</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      required
                      placeholder="الاسم الكامل"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm focus:border-amber-400 focus:outline-none"
                    />
                    <input
                      required
                      type="tel"
                      placeholder="رقم الجوال"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm focus:border-amber-400 focus:outline-none"
                  />
                  <input
                    placeholder="الموضوع"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm focus:border-amber-400 focus:outline-none"
                  />
                  <textarea
                    required
                    rows={5}
                    placeholder="رسالتك..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm focus:border-amber-400 focus:outline-none resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 bg-amber-400 text-black font-semibold rounded-full hover:bg-amber-300 transition-colors"
                  >
                    إرسال الرسالة <Send size={16} />
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-6">
              <div className="border border-white/10 rounded-sm overflow-hidden h-[300px]">
                <iframe
                  title="الموقع"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=46.6%2C24.7%2C46.8%2C24.85&layer=mapnik"
                  className="w-full h-full grayscale"
                />
              </div>

              <div className="border border-white/10 rounded-sm p-8 bg-[#0c0c0c]">
                <div className="flex items-center gap-3 mb-4">
                  <Clock size={18} className="text-amber-400" />
                  <h3 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                    ساعات العمل
                  </h3>
                </div>
                <ul className="space-y-3 text-sm">
                  {[
                    ["الأحد - الخميس", "9:00 ص - 6:00 م"],
                    ["السبت", "10:00 ص - 4:00 م"],
                    ["الجمعة", "مغلق"],
                  ].map(([day, time]) => (
                    <li key={day} className="flex justify-between items-center pb-2 border-b border-white/5 last:border-0">
                      <span className="text-white/70">{day}</span>
                      <span className="text-amber-400">{time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
