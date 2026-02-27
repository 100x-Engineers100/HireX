// Browser-compatible Excel export using ExcelJS
// Called client-side: generateExcel(results, roleTitle)

export async function generateExcel(candidates: any[], roleTitle = "screening"): Promise<void> {
  // Dynamic import so it doesn't break SSR
  const ExcelJS = (await import("exceljs")).default;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HireX";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Screening Results", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Rank",            key: "rank",           width: 6  },
    { header: "Name",            key: "name",           width: 22 },
    { header: "Score",           key: "score",          width: 8  },
    { header: "Recommendation",  key: "recommendation", width: 16 },
    { header: "Cohort",          key: "cohort",         width: 8  },
    { header: "Designation",     key: "designation",    width: 22 },
    { header: "Company",         key: "company",        width: 22 },
    { header: "Experience (yrs)",key: "experience",     width: 16 },
    { header: "Domain",          key: "domain",         width: 14 },
    { header: "Top Strengths",   key: "strengths",      width: 40 },
    { header: "Key Gaps",        key: "gaps",           width: 36 },
    { header: "Red Flags",       key: "red_flags",      width: 30 },
    { header: "Justification",   key: "justification",  width: 50 },
    { header: "Email",           key: "email",          width: 28 },
    { header: "Resume URL",      key: "resume_url",     width: 36 },
    { header: "LinkedIn",        key: "linkedin_url",   width: 36 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D0D0D" } };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 22;

  // Sort by score desc
  const sorted = [...candidates].sort(
    (a, b) => (b.score?.overall_score ?? 0) - (a.score?.overall_score ?? 0)
  );

  sorted.forEach((c, idx) => {
    const score = c.score?.overall_score ?? 0;
    const rec   = c.score?.recommendation ?? "N/A";

    const row = sheet.addRow({
      rank:          idx + 1,
      name:          c.name,
      score,
      recommendation: rec,
      cohort:        c.cohort,
      designation:   c.designation,
      company:       c.company,
      experience:    c.total_experience,
      domain:        c.domain,
      strengths:     (c.score?.top_strengths ?? []).join(" | "),
      gaps:          (c.score?.key_gaps ?? []).join(" | "),
      red_flags:     (c.score?.red_flags ?? []).join(" | "),
      justification: c.score?.justification ?? c.error ?? "",
      email:         c.email,
      resume_url:    c.resume_url,
      linkedin_url:  c.linkedin_url,
    });

    const bg = idx % 2 === 0 ? "FFF8F9FA" : "FFFFFFFF";
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
    });

    const scoreCell = row.getCell("score");
    if (score >= 8)      scoreCell.font = { bold: true, color: { argb: "FF16A34A" } };
    else if (score >= 5) scoreCell.font = { bold: true, color: { argb: "FFD97706" } };
    else                 scoreCell.font = { bold: true, color: { argb: "FFDC2626" } };
    scoreCell.alignment = { horizontal: "center", vertical: "middle" };

    const recCell = row.getCell("recommendation");
    if (rec === "Interview")   recCell.font = { bold: true, color: { argb: "FF16A34A" } };
    else if (rec === "Maybe")  recCell.font = { bold: true, color: { argb: "FFD97706" } };
    else                       recCell.font = { color: { argb: "FF6B7280" } };

    row.height = 45;
  });

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to:   { row: 1, column: sheet.columns.length },
  };

  // Trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement("a");
  a.href       = url;
  a.download   = `hirex-${roleTitle.toLowerCase().replace(/\s+/g, "-")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
