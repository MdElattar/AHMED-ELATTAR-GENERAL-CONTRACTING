import fs from "node:fs/promises";
import { buildProposalPdf } from "@/lib/proposal";
import { getExchangeRates } from "@/lib/currency";

async function main() {
  const rates = await getExchangeRates();
  const pdf = await buildProposalPdf({
    reference: "PROP-2026-0001",
    issuedAt: new Date(),
    client: {
      name: "Mohamed Elattar",
      email: "mohamed@example.com",
      company: "Alattar Holding",
      phone: "+966 50 000 0000",
    },
    project: {
      slug: "kingdom-tower",
      title: { ar: "برج المملكة", en: "Kingdom Tower" },
      location: { ar: "الرياض", en: "Riyadh" },
      category: "commercial",
      scope: [
        { ar: "تنسيق التصميم ومراجعة قابلية التنفيذ", en: "Design coordination and constructability review" },
        { ar: "استراتيجية المشتريات والحزم طويلة التوريد", en: "Procurement strategy and long-lead packages" },
        { ar: "تنفيذ الهيكل والكهروميكانيك والتشطيبات", en: "Structural, MEP, and finishes execution" },
      ],
      milestones: [
        {
          title: { ar: "التعبئة", en: "Mobilisation" },
          date: { ar: "الأسبوع ٢", en: "Week 2" },
          status: "complete",
        },
        {
          title: { ar: "الهيكل", en: "Structural frame" },
          date: { ar: "الأسبوع ١٨", en: "Week 18" },
          status: "current",
        },
        {
          title: { ar: "التسليم", en: "Handover" },
          date: { ar: "الأسبوع ٤٢", en: "Week 42" },
          status: "upcoming",
        },
      ],
    },
    estimateInput: {
      type: "commercial",
      area: 186000,
      quality: "signature",
      city: "riyadh",
      pace: "fast",
    },
    currency: "SAR",
    rates,
  });

  await fs.writeFile("/tmp/alattar-proposal.pdf", pdf);
  console.log("wrote", pdf.byteLength, "bytes", rates.source);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
