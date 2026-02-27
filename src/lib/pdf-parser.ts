// Extracts plain text from PDF or DOCX buffers

export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (
    mimeType.includes("wordprocessingml") ||
    mimeType.includes("msword") ||
    mimeType.includes("docx")
  ) {
    return extractFromDocx(buffer);
  }
  return extractFromPdf(buffer);
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  try {
    // pdf-parse must stay at v1.1.1 - v2 has class-based API
    // MUST use internal path - the main entry point runs a self-test that
    // looks for test/data/05-versions-space.pdf which does not exist at runtime
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const data = await pdfParse(buffer);
    return (data.text || "").trim();
  } catch (err) {
    console.warn("[pdf-parser] PDF extraction failed:", err);
    return "";
  }
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return (result.value || "").trim();
  } catch (err) {
    console.warn("[pdf-parser] DOCX extraction failed:", err);
    return "";
  }
}
