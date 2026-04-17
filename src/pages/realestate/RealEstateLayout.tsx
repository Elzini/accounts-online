import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Menu, X, Phone, Mail, MapPin, Instagram, Twitter, Linkedin } from "lucide-react";

const navItems = [
  { to: "/realestate", label: "الرئيسية", end: true },
  { to: "/realestate/about", label: "من نحن" },
  { to: "/realestate/projects", label: "المشاريع" },
  { to: "/realestate/units", label: "الوحدات المتاحة" },
  { to: "/realestate/news", label: "الأخبار" },
  { to: "/realestate/contact", label: "تواصل" },
];

export default function RealEstateLayout() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  if (typeof window !== "undefined") {
    window.addEventListener(
      "scroll",
      () => setScrolled(window.scrollY > 40),
      { passive: true }
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#0a0a0a] text-white font-sans" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Top bar */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled || open
            ? "bg-[#0a0a0a]/95 backdrop-blur-md border-b border-amber-500/10 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link to="/realestate" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full border border-amber-400/60 flex items-center justify-center text-amber-400 font-bold group-hover:bg-amber-400 group-hover:text-black transition-colors">
              أ
            </div>
            <div className="leading-tight">
              <div className="text-base font-bold tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
                أفق الفرص
              </div>
              <div className="text-[10px] text-amber-400/80 tracking-[0.25em]">REAL ESTATE</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `text-sm transition-colors relative py-1 ${
                    isActive
                      ? "text-amber-400"
                      : "text-white/70 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <span className="absolute -bottom-1 right-0 left-0 h-px bg-amber-400" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <a
              href="tel:+966500000000"
              className="px-5 py-2 border border-amber-400/40 text-amber-400 text-sm rounded-full hover:bg-amber-400 hover:text-black transition-all"
            >
              اتصل بنا
            </a>
          </div>

          <button
            className="lg:hidden text-white"
            onClick={() => setOpen(!open)}
            aria-label="القائمة"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden border-t border-white/10 mt-3">
            <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `text-base ${isActive ? "text-amber-400" : "text-white/80"}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <a
                href="tel:+966500000000"
                className="mt-2 px-5 py-2 border border-amber-400/40 text-amber-400 text-sm rounded-full text-center"
              >
                اتصل بنا
              </a>
            </div>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-500/10 bg-[#070707] mt-24">
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full border border-amber-400/60 flex items-center justify-center text-amber-400 font-bold">
                  أ
                </div>
                <div className="leading-tight">
                  <div className="text-base font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                    أفق الفرص الاستثمارية
                  </div>
                  <div className="text-[10px] text-amber-400/80 tracking-[0.25em]">REAL ESTATE</div>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-loose max-w-md">
                نُعيد تعريف الفخامة في التطوير العقاري، عبر مشاريع سكنية متميزة تجمع بين الأصالة المعمارية والرفاهية العصرية في أرقى مواقع المملكة.
              </p>
              <div className="flex gap-3 mt-6">
                {[Instagram, Twitter, Linkedin].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/70 hover:text-amber-400 hover:border-amber-400/50 transition-all"
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-amber-400 text-xs tracking-[0.25em] mb-4">روابط سريعة</h4>
              <ul className="space-y-3">
                {navItems.map((it) => (
                  <li key={it.to}>
                    <Link to={it.to} className="text-white/60 text-sm hover:text-amber-400 transition-colors">
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-amber-400 text-xs tracking-[0.25em] mb-4">تواصل معنا</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <MapPin size={15} className="text-amber-400 mt-0.5" />
                  الرياض، حي الياسمين
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={15} className="text-amber-400" />
                  +966 50 000 0000
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={15} className="text-amber-400" />
                  info@afaq-realestate.sa
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <div>© {new Date().getFullYear()} أفق الفرص الاستثمارية. جميع الحقوق محفوظة.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-amber-400">سياسة الخصوصية</a>
              <a href="#" className="hover:text-amber-400">الشروط والأحكام</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
