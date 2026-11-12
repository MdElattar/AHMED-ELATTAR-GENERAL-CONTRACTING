import fs from "node:fs/promises";
import path from "node:path";
import fontkit, { type Font } from "@pdf-lib/fontkit";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import {
  computeEstimate,
  costBreakdownForType,
  type EstimateInput,
} from "@/lib/estimate";
import {
  convertFromSar,
  formatCurrencyValue,
  type CurrencyCode,
  type ExchangeRates,
} from "@/lib/currency";

export type LocalizedFact = { ar: string; en: string };

export type ProposalProject = {
  slug: string;
  title: LocalizedFact;
  location: LocalizedFact;
  category: string;
  scope: LocalizedFact[];
  milestones: {
    title: LocalizedFact;
    date: LocalizedFact;
    status: string;
  }[];
};

export type ProposalInput = {
  reference: string;
  issuedAt: Date;
  client: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
  };
  project: ProposalProject;
  estimateInput: EstimateInput;
  currency: CurrencyCode;
  rates: ExchangeRates;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 52;

const obsidian = rgb(0.024, 0.027, 0.031);
const ivory = rgb(0.953, 0.933, 0.894);
const gold = rgb(0.831, 0.686, 0.216);
const champagne = rgb(0.949, 0.875, 0.722);
const muted = rgb(0.588, 0.576, 0.545);
const ink = rgb(0.09, 0.09, 0.1);
const body = rgb(0.28, 0.28, 0.3);
const hairline = rgb(0.86, 0.84, 0.79);
const paper = rgb(0.975, 0.968, 0.952);

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawWrapped(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    maxWidth: number;
    size: number;
    lineHeight: number;
    font: PDFFont;
    color: RGB;
  },
) {
  const lines = wrapText(text, options.font, options.size, options.maxWidth);
  let y = options.y;
  for (const line of lines) {
    page.drawText(line, {
      x: options.x,
      y,
      size: options.size,
      font: options.font,
      color: options.color,
    });
    y -= options.lineHeight;
  }
  return y;
}

function label(page: PDFPage, text: string, x: number, y: number, font: PDFFont, color = gold) {
  page.drawText(text, { x, y, size: 8, font, color });
}

function rule(page: PDFPage, x: number, y: number, width: number, color = hairline) {
  page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: 0.6, color });
}

type ArabicFont = {
  font: Font;
  draw: (
    page: PDFPage,
    text: string,
    options: { x: number; y: number; size: number; color: RGB; align?: "left" | "right" | "center" },
  ) => number;
};

async function loadArabicFont(): Promise<ArabicFont | null> {
  try {
    const file = await fs.readFile(
      path.join(process.cwd(), "public", "fonts", "NotoNaskhArabic.ttf"),
    );
    const font = fontkit.create(new Uint8Array(file));

    const draw: ArabicFont["draw"] = (page, text, options) => {
      // Fontkit shapes Arabic correctly but returns glyphs in logical order.
      // Reversing the glyph run produces the visual right-to-left order, and
      // drawing the outlines as vectors keeps the PDF self-contained without
      // relying on a viewer-installed Arabic font.
      const run = (
        font as unknown as {
          layout: (
            value: string,
            features?: unknown,
            script?: string,
            language?: string,
            direction?: string,
          ) => { glyphs: { path: { toSVG: () => string }; advanceWidth: number }[]; advanceWidth: number };
        }
      ).layout(text, undefined, "arab", undefined, "rtl");

      const scale = options.size / font.unitsPerEm;
      const width = run.advanceWidth * scale;
      let cursor =
        options.align === "right"
          ? options.x - width
          : options.align === "center"
            ? options.x - width / 2
            : options.x;

      for (const glyph of [...run.glyphs].reverse()) {
        const d = glyph.path.toSVG();
        if (d) {
          page.drawSvgPath(d, {
            x: cursor,
            y: options.y,
            scale,
            color: options.color,
            borderWidth: 0,
          });
        }
        cursor += glyph.advanceWidth * scale;
      }

      return width;
    };

    return { font, draw };
  } catch (error) {
    console.error("[proposal] Arabic font unavailable", error);
    return null;
  }
}

function drawCover(
  page: PDFPage,
  input: ProposalInput,
  helvetica: PDFFont,
  helveticaBold: PDFFont,
  arabic: ArabicFont | null,
) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: obsidian });
  page.drawRectangle({
    x: 34,
    y: 34,
    width: PAGE_WIDTH - 68,
    height: PAGE_HEIGHT - 68,
    borderColor: gold,
    borderWidth: 0.8,
  });
  page.drawRectangle({
    x: 42,
    y: 42,
    width: PAGE_WIDTH - 84,
    height: PAGE_HEIGHT - 84,
    borderColor: rgb(0.55, 0.46, 0.22),
    borderWidth: 0.35,
  });

  page.drawText("AHMED ELATTAR", {
    x: MARGIN,
    y: PAGE_HEIGHT - 92,
    size: 11,
    font: helveticaBold,
    color: ivory,
  });
  page.drawText("GENERAL CONTRACTING CO.", {
    x: MARGIN,
    y: PAGE_HEIGHT - 108,
    size: 7.5,
    font: helvetica,
    color: muted,
  });

  if (arabic) {
    arabic.draw(page, "شركة أحمد العطار للمقاولات العامة", {
      x: PAGE_WIDTH - MARGIN,
      y: PAGE_HEIGHT - 98,
      size: 15,
      color: gold,
      align: "right",
    });
  }

  rule(page, MARGIN, PAGE_HEIGHT - 132, PAGE_WIDTH - MARGIN * 2, rgb(0.3, 0.26, 0.16));

  page.drawText("PROJECT PROPOSAL", {
    x: MARGIN,
    y: PAGE_HEIGHT - 210,
    size: 10,
    font: helveticaBold,
    color: gold,
  });
  page.drawText("PREMIUM CONTRACTING · KINGDOM OF SAUDI ARABIA", {
    x: MARGIN,
    y: PAGE_HEIGHT - 226,
    size: 7,
    font: helvetica,
    color: muted,
  });

  const title = input.project.title.en || input.project.slug || "Bespoke engagement";
  let titleY = PAGE_HEIGHT - 300;
  const titleLines = wrapText(title, helveticaBold, 34, PAGE_WIDTH - MARGIN * 2);
  for (const line of titleLines.slice(0, 3)) {
    page.drawText(line, {
      x: MARGIN,
      y: titleY,
      size: 34,
      font: helveticaBold,
      color: ivory,
    });
    titleY -= 40;
  }

  if (arabic && input.project.title.ar) {
    arabic.draw(page, input.project.title.ar, {
      x: PAGE_WIDTH - MARGIN,
      y: titleY - 6,
      size: 22,
      color: champagne,
      align: "right",
    });
    titleY -= 38;
  }

  if (input.project.location.en) {
    page.drawText(input.project.location.en, {
      x: MARGIN,
      y: titleY - 6,
      size: 10,
      font: helvetica,
      color: muted,
    });
  }

  const clientTop = 340;
  label(page, "PREPARED FOR", MARGIN, clientTop, helveticaBold);
  page.drawText(input.client.name, {
    x: MARGIN,
    y: clientTop - 24,
    size: 18,
    font: helveticaBold,
    color: ivory,
  });
  let clientY = clientTop - 46;
  if (input.client.company) {
    page.drawText(input.client.company, {
      x: MARGIN,
      y: clientY,
      size: 10,
      font: helvetica,
      color: champagne,
    });
    clientY -= 16;
  }
  page.drawText(input.client.email, {
    x: MARGIN,
    y: clientY,
    size: 9,
    font: helvetica,
    color: muted,
  });
  if (input.client.phone) {
    page.drawText(input.client.phone, {
      x: MARGIN,
      y: clientY - 15,
      size: 9,
      font: helvetica,
      color: muted,
    });
  }

  const metaY = 178;
  rule(page, MARGIN, metaY + 28, PAGE_WIDTH - MARGIN * 2, rgb(0.3, 0.26, 0.16));
  const meta = [
    ["REFERENCE", input.reference],
    ["ISSUED", input.issuedAt.toISOString().slice(0, 10)],
    ["CURRENCY", input.currency],
  ];
  let metaX = MARGIN;
  for (const [key, value] of meta) {
    label(page, key, metaX, metaY, helveticaBold);
    page.drawText(value, {
      x: metaX,
      y: metaY - 17,
      size: 9,
      font: helvetica,
      color: ivory,
    });
    metaX += 165;
  }

  page.drawText("CONFIDENTIAL · PREPARED EXCLUSIVELY FOR THE NAMED CLIENT", {
    x: MARGIN,
    y: 72,
    size: 6.5,
    font: helvetica,
    color: muted,
  });
}

function drawSummaryPage(
  page: PDFPage,
  input: ProposalInput,
  helvetica: PDFFont,
  helveticaBold: PDFFont,
  arabic: ArabicFont | null,
) {
  const estimate = computeEstimate(input.estimateInput);
  const breakdown = costBreakdownForType(input.estimateInput.type);
  const money = (amountSar: number) =>
    formatCurrencyValue(
      convertFromSar(amountSar, input.currency, input.rates.rates),
      input.currency,
      "en",
    );

  page.drawText("01", {
    x: MARGIN,
    y: PAGE_HEIGHT - 80,
    size: 9,
    font: helveticaBold,
    color: gold,
  });
  page.drawText("EXECUTIVE SUMMARY", {
    x: MARGIN + 22,
    y: PAGE_HEIGHT - 80,
    size: 16,
    font: helveticaBold,
    color: ink,
  });
  if (arabic) {
    arabic.draw(page, "الملخص التنفيذي", {
      x: PAGE_WIDTH - MARGIN,
      y: PAGE_HEIGHT - 80,
      size: 14,
      color: gold,
      align: "right",
    });
  }
  rule(page, MARGIN, PAGE_HEIGHT - 94, PAGE_WIDTH - MARGIN * 2);

  const area = Math.round(input.estimateInput.area).toLocaleString("en-US");
  const summary = `This proposal sets out the preliminary commercial and technical framework for ${input.project.title.en || "the proposed engagement"} at ${input.project.location.en || "the project site"}. The indicative programme covers approximately ${area} m² of built area and is calibrated against Ahmed Elattar's delivered portfolio, current Riyadh-market rates, and the selected ${input.estimateInput.quality} specification.`;

  let y = drawWrapped(page, summary, {
    x: MARGIN,
    y: PAGE_HEIGHT - 124,
    maxWidth: PAGE_WIDTH - MARGIN * 2,
    size: 9.6,
    lineHeight: 15,
    font: helvetica,
    color: body,
  });

  y -= 20;
  page.drawText("02", {
    x: MARGIN,
    y,
    size: 9,
    font: helveticaBold,
    color: gold,
  });
  page.drawText("PRELIMINARY INVESTMENT", {
    x: MARGIN + 22,
    y,
    size: 12,
    font: helveticaBold,
    color: ink,
  });
  y -= 26;

  const tableX = MARGIN;
  const tableWidth = PAGE_WIDTH - MARGIN * 2;
  const rows = [
    ["Structure & envelope", breakdown[0]?.pct ?? 0],
    ["Finishes & joinery", breakdown[1]?.pct ?? 0],
    ["MEP & smart systems", breakdown[2]?.pct ?? 0],
    ["Management, QA & logistics", breakdown[3]?.pct ?? 0],
  ] as const;

  page.drawRectangle({ x: tableX, y: y - 4, width: tableWidth, height: 20, color: paper });
  page.drawText("COST CENTRE", { x: tableX + 10, y: y + 2, size: 7, font: helveticaBold, color: muted });
  page.drawText("SHARE", { x: tableX + 320, y: y + 2, size: 7, font: helveticaBold, color: muted });
  page.drawText("INDICATIVE VALUE", { x: tableX + 390, y: y + 2, size: 7, font: helveticaBold, color: muted });
  y -= 24;

  for (const [name, pct] of rows) {
    page.drawText(name, { x: tableX + 10, y, size: 9, font: helvetica, color: ink });
    page.drawText(`${pct}%`, { x: tableX + 320, y, size: 9, font: helveticaBold, color: gold });
    page.drawText(money((estimate.total * pct) / 100), {
      x: tableX + 390,
      y,
      size: 9,
      font: helvetica,
      color: ink,
    });
    y -= 22;
    rule(page, tableX, y + 8, tableWidth);
  }

  y -= 10;
  page.drawRectangle({
    x: tableX,
    y: y - 62,
    width: tableWidth,
    height: 72,
    color: obsidian,
  });
  page.drawText("PRELIMINARY RANGE", {
    x: tableX + 18,
    y: y - 8,
    size: 7,
    font: helveticaBold,
    color: gold,
  });
  page.drawText(`${money(estimate.low)} — ${money(estimate.high)}`, {
    x: tableX + 18,
    y: y - 34,
    size: 18,
    font: helveticaBold,
    color: ivory,
  });
  page.drawText(
    `Indicative programme · ${estimate.months} months · ${money(estimate.perM2)} / m²`,
    { x: tableX + 18, y: y - 52, size: 7.5, font: helvetica, color: muted },
  );

  y -= 92;
  page.drawText("03", { x: MARGIN, y, size: 9, font: helveticaBold, color: gold });
  page.drawText("SCOPE FRAMEWORK", { x: MARGIN + 22, y, size: 12, font: helveticaBold, color: ink });
  y -= 22;

  const scope = input.project.scope.map((item) => item.en).filter(Boolean).slice(0, 6);
  const fallbackScope = [
    "Design coordination and constructability review",
    "Procurement strategy and long-lead packages",
    "Structural, MEP, and finishes execution",
    "Quality assurance, HSE, and commissioning",
  ];
  for (const item of scope.length ? scope : fallbackScope) {
    page.drawCircle({ x: MARGIN + 4, y: y + 3, size: 1.6, color: gold });
    y = drawWrapped(page, item, {
      x: MARGIN + 16,
      y,
      maxWidth: PAGE_WIDTH - MARGIN * 2 - 16,
      size: 9,
      lineHeight: 13,
      font: helvetica,
      color: body,
    });
    y -= 5;
  }

  page.drawText(
    "Indicative only. Final scope, quantities, and contract value are confirmed after technical due diligence.",
    {
      x: MARGIN,
      y: 58,
      size: 6.8,
      font: helvetica,
      color: muted,
    },
  );
  page.drawText("02", {
    x: PAGE_WIDTH - MARGIN - 8,
    y: 58,
    size: 8,
    font: helveticaBold,
    color: gold,
  });
}

function drawProgrammePage(
  page: PDFPage,
  input: ProposalInput,
  helvetica: PDFFont,
  helveticaBold: PDFFont,
  arabic: ArabicFont | null,
) {
  page.drawText("04", { x: MARGIN, y: PAGE_HEIGHT - 80, size: 9, font: helveticaBold, color: gold });
  page.drawText("PROGRAMME & MILESTONES", {
    x: MARGIN + 22,
    y: PAGE_HEIGHT - 80,
    size: 16,
    font: helveticaBold,
    color: ink,
  });
  if (arabic) {
    arabic.draw(page, "البرنامج الزمني والمحطات", {
      x: PAGE_WIDTH - MARGIN,
      y: PAGE_HEIGHT - 80,
      size: 13,
      color: gold,
      align: "right",
    });
  }
  rule(page, MARGIN, PAGE_HEIGHT - 94, PAGE_WIDTH - MARGIN * 2);

  let y = PAGE_HEIGHT - 124;
  const milestones = input.project.milestones.slice(0, 6);
  const fallback = [
    { title: { ar: "التعبئة والتجهيز", en: "Mobilisation" }, date: { ar: "الأسبوع ٢", en: "Week 2" }, status: "complete" },
    { title: { ar: "الهيكل الخرساني", en: "Structural frame" }, date: { ar: "الأسبوع ١٨", en: "Week 18" }, status: "current" },
    { title: { ar: "التسليم النهائي", en: "Handover" }, date: { ar: "الأسبوع ٤٢", en: "Week 42" }, status: "upcoming" },
  ];

  for (const milestone of milestones.length ? milestones : fallback) {
    page.drawText(milestone.title.en, {
      x: MARGIN,
      y,
      size: 9.5,
      font: helveticaBold,
      color: ink,
    });
    page.drawText(milestone.date.en, {
      x: MARGIN + 310,
      y,
      size: 9,
      font: helvetica,
      color: body,
    });
    page.drawText(milestone.status.toUpperCase(), {
      x: MARGIN + 420,
      y,
      size: 7,
      font: helveticaBold,
      color: milestone.status === "complete" ? gold : muted,
    });
    y -= 18;
    rule(page, MARGIN, y + 6, PAGE_WIDTH - MARGIN * 2);
    y -= 6;
  }

  y -= 16;
  page.drawText("05", { x: MARGIN, y, size: 9, font: helveticaBold, color: gold });
  page.drawText("COMMERCIAL TERMS", {
    x: MARGIN + 22,
    y,
    size: 12,
    font: helveticaBold,
    color: ink,
  });
  y -= 22;

  const terms = [
    "Validity: 30 calendar days from the issue date.",
    "Payment schedule: 20% mobilisation · 40% structural · 30% finishes · 10% handover.",
    "Currency: amounts are quoted in the selected currency and reconciled to SAR at the daily reference rate.",
    "Exclusions: land acquisition, authority fees, utility connections, and VAT unless expressly stated.",
  ];
  for (const term of terms) {
    page.drawCircle({ x: MARGIN + 4, y: y + 3, size: 1.5, color: gold });
    y = drawWrapped(page, term, {
      x: MARGIN + 16,
      y,
      maxWidth: PAGE_WIDTH - MARGIN * 2 - 16,
      size: 8.8,
      lineHeight: 13,
      font: helvetica,
      color: body,
    });
    y -= 4;
  }

  y -= 12;
  page.drawText("06", { x: MARGIN, y, size: 9, font: helveticaBold, color: gold });
  page.drawText("NEXT STEPS", { x: MARGIN + 22, y, size: 12, font: helveticaBold, color: ink });
  y -= 22;
  const steps = [
    "Technical discovery and site verification with the delivery team.",
    "Final scope, BOQ, and programme validation.",
    "Contract award, mobilisation, and executive sponsor assignment.",
  ];
  for (let index = 0; index < steps.length; index += 1) {
    page.drawText(String(index + 1).padStart(2, "0"), {
      x: MARGIN,
      y,
      size: 8,
      font: helveticaBold,
      color: gold,
    });
    y = drawWrapped(page, steps[index], {
      x: MARGIN + 22,
      y,
      maxWidth: PAGE_WIDTH - MARGIN * 2 - 22,
      size: 9,
      lineHeight: 13,
      font: helvetica,
      color: body,
    });
    y -= 6;
  }

  const signatureY = 188;
  rule(page, MARGIN, signatureY + 52, PAGE_WIDTH - MARGIN * 2);
  page.drawText("FOR AHMED ELATTAR GENERAL CONTRACTING", {
    x: MARGIN,
    y: signatureY + 34,
    size: 7,
    font: helveticaBold,
    color: muted,
  });
  page.drawLine({
    start: { x: MARGIN, y: signatureY + 8 },
    end: { x: MARGIN + 190, y: signatureY + 8 },
    thickness: 0.6,
    color: hairline,
  });
  page.drawText("Authorised signatory", {
    x: MARGIN,
    y: signatureY - 4,
    size: 7.5,
    font: helvetica,
    color: muted,
  });

  page.drawText("FOR THE CLIENT", {
    x: MARGIN + 300,
    y: signatureY + 34,
    size: 7,
    font: helveticaBold,
    color: muted,
  });
  page.drawLine({
    start: { x: MARGIN + 300, y: signatureY + 8 },
    end: { x: MARGIN + 490, y: signatureY + 8 },
    thickness: 0.6,
    color: hairline,
  });
  page.drawText(input.client.name, {
    x: MARGIN + 300,
    y: signatureY - 4,
    size: 7.5,
    font: helvetica,
    color: muted,
  });

  drawWrapped(
    page,
    "This document is a preliminary proposal, not a binding offer. All figures are subject to final design, authority approvals, and a signed contract.",
    {
      x: MARGIN,
      y: 72,
      maxWidth: PAGE_WIDTH - MARGIN * 2 - 30,
      size: 6.6,
      lineHeight: 9,
      font: helvetica,
      color: muted,
    },
  );
  page.drawText("03", {
    x: PAGE_WIDTH - MARGIN - 8,
    y: 72,
    size: 8,
    font: helveticaBold,
    color: gold,
  });
}

export async function buildProposalPdf(input: ProposalInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const arabic = await loadArabicFont();

  doc.setTitle(`Project proposal · ${input.project.title.en || input.reference}`);
  doc.setAuthor("Ahmed Elattar General Contracting Co.");
  doc.setSubject("Preliminary project proposal");
  doc.setProducer("Ahmed Elattar Digital Studio");
  doc.setCreationDate(input.issuedAt);

  const cover = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawCover(cover, input, helvetica, helveticaBold, arabic);

  const summary = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawSummaryPage(summary, input, helvetica, helveticaBold, arabic);

  const programme = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawProgrammePage(programme, input, helvetica, helveticaBold, arabic);

  return doc.save();
}
