// Fetches resume PDF/DOCX from various URL formats
// Returns buffer + mime type, or null if unreachable

const GDRIVE_EXPORT_BASE = "https://drive.google.com/uc?export=download&id=";

function extractGDriveId(url: string): string | null {
  // Only process actual Google Drive URLs
  if (!url.includes("drive.google.com")) return null;
  // https://drive.google.com/file/d/{id}/view
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];
  // https://drive.google.com/open?id={id}
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return openMatch[1];
  return null;
}

function extractGDocsId(url: string): string | null {
  if (!url.includes("docs.google.com")) return null;
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export async function fetchResume(
  rawUrl: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!rawUrl || rawUrl.trim() === "") return null;

  let fetchUrl = rawUrl.trim();
  let mimeType = "application/pdf";

  // Tally private storage - these require auth, skip silently
  if (fetchUrl.includes("storage.tally.so/private")) {
    return null;
  }

  // Google Docs -> export as docx
  const docsId = extractGDocsId(fetchUrl);
  if (docsId) {
    fetchUrl = `https://docs.google.com/document/d/${docsId}/export?format=docx`;
    mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } else {
    // Google Drive file -> direct download
    const driveId = extractGDriveId(fetchUrl);
    if (driveId) {
      fetchUrl = `${GDRIVE_EXPORT_BASE}${driveId}`;
    }
    // Otherwise use URL as-is (direct PDF/DOCX links)
  }

  try {
    const response = await fetch(fetchUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[pdf-fetcher] HTTP ${response.status} for ${fetchUrl.slice(0, 80)}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("wordprocessingml") || contentType.includes("msword")) {
      mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (contentType.includes("pdf")) {
      mimeType = "application/pdf";
    }

    const arrayBuffer = await response.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), mimeType };
  } catch (err) {
    console.warn(`[pdf-fetcher] Failed: ${(err as Error).message}`);
    return null;
  }
}
