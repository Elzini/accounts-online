import project1 from "@/assets/realestate/project-1.jpg";
import project2 from "@/assets/realestate/project-2.jpg";
import project3 from "@/assets/realestate/project-3.jpg";

export const projects = [
  {
    id: "afaq-yasmeen",
    name: "أفق الياسمين",
    location: "الرياض - حي الياسمين",
    type: "مجمع فلل سكنية",
    units: 48,
    status: "قيد التنفيذ",
    image: project1,
    description:
      "مجمع سكني فاخر يضم 48 فيلا مصممة بطراز معماري معاصر، يجمع بين الخصوصية والرفاهية في قلب شمال الرياض.",
    deliveryDate: "2026 Q4",
  },
  {
    id: "afaq-narjis",
    name: "أفق النرجس",
    location: "الرياض - حي النرجس",
    type: "فلل مستقلة فاخرة",
    units: 24,
    status: "متاح للبيع",
    image: project2,
    description:
      "فلل مستقلة بتصاميم مبتكرة، تتميز بمساحات واسعة وتشطيبات راقية تلبي تطلعات أرقى الأذواق.",
    deliveryDate: "2026 Q1",
  },
  {
    id: "afaq-malqa",
    name: "أفق الملقا",
    location: "الرياض - حي الملقا",
    type: "تاون هاوس",
    units: 36,
    status: "قريباً",
    image: project3,
    description:
      "مشروع تاون هاوس راقي بتصميم أندلسي معاصر، يضم 36 وحدة بأفنية داخلية وممرات شجرية مظللة.",
    deliveryDate: "2027 Q2",
  },
];

export const units = [
  {
    id: "u-101",
    project: "أفق الياسمين",
    type: "فيلا - نموذج A",
    bedrooms: 5,
    bathrooms: 6,
    area: 480,
    price: 3_250_000,
    status: "متاحة",
    image: project1,
  },
  {
    id: "u-102",
    project: "أفق الياسمين",
    type: "فيلا - نموذج B",
    bedrooms: 6,
    bathrooms: 7,
    area: 560,
    price: 3_850_000,
    status: "محجوزة",
    image: project2,
  },
  {
    id: "u-201",
    project: "أفق النرجس",
    type: "فيلا مستقلة",
    bedrooms: 7,
    bathrooms: 8,
    area: 720,
    price: 5_200_000,
    status: "متاحة",
    image: project2,
  },
  {
    id: "u-202",
    project: "أفق النرجس",
    type: "فيلا دوبلكس",
    bedrooms: 5,
    bathrooms: 6,
    area: 540,
    price: 4_100_000,
    status: "متاحة",
    image: project3,
  },
  {
    id: "u-301",
    project: "أفق الملقا",
    type: "تاون هاوس",
    bedrooms: 4,
    bathrooms: 5,
    area: 380,
    price: 2_450_000,
    status: "قريباً",
    image: project1,
  },
  {
    id: "u-302",
    project: "أفق الملقا",
    type: "تاون هاوس - زاوية",
    bedrooms: 5,
    bathrooms: 5,
    area: 420,
    price: 2_780_000,
    status: "متاحة",
    image: project3,
  },
];

export const news = [
  {
    id: 1,
    title: "إطلاق المرحلة الثانية من مشروع أفق الياسمين",
    date: "2026/03/15",
    excerpt: "بحضور نخبة من رجال الأعمال والمهتمين بقطاع التطوير العقاري، أعلنت شركة أفق الفرص عن إطلاق المرحلة الثانية...",
    image: project1,
  },
  {
    id: 2,
    title: "شراكة استراتيجية مع أكبر بنوك التمويل العقاري",
    date: "2026/02/28",
    excerpt: "وقّعت أفق الفرص اتفاقية شراكة مع كبرى البنوك السعودية لتوفير حلول تمويلية ميسرة لعملاء مشاريعها...",
    image: project2,
  },
  {
    id: 3,
    title: "جائزة أفضل مشروع سكني فاخر لعام 2025",
    date: "2026/01/10",
    excerpt: "حصل مشروع أفق النرجس على جائزة أفضل مشروع سكني فاخر في المملكة لعام 2025، تقديراً للجودة والابتكار...",
    image: project3,
  },
];

export const partners = [
  "البنك الأهلي السعودي",
  "بنك الراجحي",
  "صندوق التنمية العقارية",
  "وزارة الإسكان",
  "الهيئة الملكية",
  "أمانة الرياض",
];
