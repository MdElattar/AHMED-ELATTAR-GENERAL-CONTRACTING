import { NextResponse, connection } from "next/server";
import { getExchangeRates } from "@/lib/currency";

export async function GET() {
  await connection();
  const rates = await getExchangeRates();

  return NextResponse.json(rates, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
