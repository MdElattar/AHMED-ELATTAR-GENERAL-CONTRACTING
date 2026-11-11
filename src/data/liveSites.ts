import { L, type Localized } from "@/lib/dictionary";
import {
  liveSiteGalleryPhotos,
  liveSitePhotos,
  type MediaAsset,
} from "@/data/media";

export type LiveSiteId = "riyadh" | "cairo" | "mansoura";

export type LiveSite = {
  id: LiveSiteId;
  city: Localized;
  country: Localized;
  project: Localized;
  district: Localized;
  status: Localized;
  progress: number;
  coordinates: string;
  photo: MediaAsset;
  gallery: MediaAsset[];
  specs: { label: Localized; value: string }[];
  telemetry: { label: Localized; value: string; unit: string }[];
  milestones: { label: Localized; date: string; done: boolean }[];
  nextMilestone: Localized;
};

export const liveSites: LiveSite[] = [
  {
    id: "riyadh",
    city: L("الرياض", "Riyadh"),
    country: L("السعودية", "Saudi Arabia"),
    project: L("برج أورورا", "Aurora Tower"),
    district: L("طريق الملك فهد", "King Fahd Road"),
    status: L("قيد التنفيذ", "Under construction"),
    progress: 78,
    coordinates: "24.7136° N · 46.6753° E",
    photo: liveSitePhotos.riyadh,
    gallery: [...liveSiteGalleryPhotos.riyadh],
    specs: [
      { label: L("الطوابق", "Floors"), value: "54" },
      { label: L("المساحة الإجمالية", "Gross floor area"), value: "96,400 m²" },
      { label: L("الخرسانة", "Concrete"), value: "142,000 m³" },
      { label: L("الحديد", "Structural steel"), value: "18,600 t" },
      { label: L("الأوناش", "Tower cranes"), value: "06" },
      { label: L("القوى العاملة", "Workforce"), value: "1,840" },
    ],
    telemetry: [
      { label: L("خرسانة مصبوبة", "Concrete poured"), value: "108,400", unit: "m³" },
      { label: L("حديد مركّب", "Steel erected"), value: "14,200", unit: "t" },
      { label: L("أقصى حمل ونش", "Peak crane load"), value: "42.6", unit: "t" },
      { label: L("الرياح", "Wind"), value: "12", unit: "km/h" },
    ],
    milestones: [
      { label: L("أعمال التهيئة", "Enabling works"), date: "2024 Q1", done: true },
      { label: L("الأساسات واللبشة", "Foundation & raft"), date: "2024 Q3", done: true },
      { label: L("النواة حتى الطابق 54", "Core to level 54"), date: "2025 Q2", done: true },
      { label: L("الواجهة حتى الطابق 38", "Façade to level 38"), date: "2025 Q4", done: true },
      { label: L("الأعمال الكهروميكانيكية", "MEP first fix"), date: "2026 Q2", done: false },
      { label: L("التسليم", "Handover"), date: "2027 Q4", done: false },
    ],
    nextMilestone: L("الأعمال الكهروميكانيكية · الطابق 38", "MEP first fix · Level 38"),
  },
  {
    id: "cairo",
    city: L("القاهرة", "Cairo"),
    country: L("مصر", "Egypt"),
    project: L("نايل كريست", "Nile Crest"),
    district: L("القاهرة الجديدة", "New Cairo"),
    status: L("قيد التنفيذ", "Under construction"),
    progress: 54,
    coordinates: "30.0444° N · 31.2357° E",
    photo: liveSitePhotos.cairo,
    gallery: [...liveSiteGalleryPhotos.cairo],
    specs: [
      { label: L("الطوابق", "Floors"), value: "38" },
      { label: L("المساحة الإجمالية", "Gross floor area"), value: "72,800 m²" },
      { label: L("الخرسانة", "Concrete"), value: "98,000 m³" },
      { label: L("الحديد", "Structural steel"), value: "12,400 t" },
      { label: L("الأوناش", "Tower cranes"), value: "04" },
      { label: L("القوى العاملة", "Workforce"), value: "1,260" },
    ],
    telemetry: [
      { label: L("خرسانة مصبوبة", "Concrete poured"), value: "61,200", unit: "m³" },
      { label: L("حديد مركّب", "Steel erected"), value: "8,900", unit: "t" },
      { label: L("أقصى حمل ونش", "Peak crane load"), value: "36.2", unit: "t" },
      { label: L("الرياح", "Wind"), value: "9", unit: "km/h" },
    ],
    milestones: [
      { label: L("أعمال التهيئة", "Enabling works"), date: "2024 Q2", done: true },
      { label: L("الخوازيق", "Piling"), date: "2024 Q4", done: true },
      { label: L("النواة حتى الطابق 24", "Core to level 24"), date: "2025 Q3", done: true },
      { label: L("نموذج الواجهة", "Façade mock-up"), date: "2026 Q1", done: false },
      { label: L("الأعمال الكهروميكانيكية", "MEP first fix"), date: "2026 Q4", done: false },
      { label: L("التسليم", "Handover"), date: "2028 Q2", done: false },
    ],
    nextMilestone: L("نموذج الواجهة · القاهرة الجديدة", "Façade mock-up · New Cairo"),
  },
  {
    id: "mansoura",
    city: L("المنصورة", "Mansoura"),
    country: L("مصر", "Egypt"),
    project: L("مركز الدلتا اللوجستي", "Delta Logistics Hub"),
    district: L("المنطقة الصناعية", "Industrial Zone"),
    status: L("قيد التنفيذ", "Under construction"),
    progress: 31,
    coordinates: "31.0409° N · 31.3785° E",
    photo: liveSitePhotos.mansoura,
    gallery: [...liveSiteGalleryPhotos.mansoura],
    specs: [
      { label: L("المساحة الإجمالية", "Gross floor area"), value: "140,000 m²" },
      { label: L("الارتفاع الصافي", "Clear height"), value: "18 m" },
      { label: L("الخرسانة", "Concrete"), value: "64,000 m³" },
      { label: L("الحديد", "Structural steel"), value: "9,800 t" },
      { label: L("الأوناش", "Tower cranes"), value: "03" },
      { label: L("القوى العاملة", "Workforce"), value: "720" },
    ],
    telemetry: [
      { label: L("خرسانة مصبوبة", "Concrete poured"), value: "24,800", unit: "m³" },
      { label: L("حديد مركّب", "Steel erected"), value: "2,100", unit: "t" },
      { label: L("أقصى حمل ونش", "Peak crane load"), value: "28.4", unit: "t" },
      { label: L("الرياح", "Wind"), value: "14", unit: "km/h" },
    ],
    milestones: [
      { label: L("تجهيز الموقع", "Site mobilisation"), date: "2025 Q1", done: true },
      { label: L("تحسين التربة", "Ground improvement"), date: "2025 Q3", done: true },
      { label: L("الأساسات", "Foundations"), date: "2026 Q1", done: false },
      { label: L("الهيكل المعدني", "Steel frame"), date: "2026 Q3", done: false },
      { label: L("الغلاف الخارجي", "Envelope"), date: "2027 Q1", done: false },
      { label: L("التسليم", "Handover"), date: "2028 Q3", done: false },
    ],
    nextMilestone: L("صب الأساسات · المنطقة الصناعية", "Foundation pour · Industrial Zone"),
  },
];

export function getLiveSite(id: LiveSiteId) {
  return liveSites.find((site) => site.id === id) ?? liveSites[0];
}
