import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ALLOWED_COHORTS = new Set(["c4", "c5", "c6"]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cohort = (searchParams.get("cohort") || "").toLowerCase();

  if (!ALLOWED_COHORTS.has(cohort)) {
    return NextResponse.json({ error: "Invalid cohort. Use c4, c5, or c6." }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public", "data", `${cohort}.csv`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: `CSV not found: public/data/${cohort}.csv` },
      { status: 404 }
    );
  }

  const csv = fs.readFileSync(filePath, "utf-8");
  return new NextResponse(csv, {
    status: 200,
    headers: { "Content-Type": "text/csv; charset=utf-8" },
  });
}
