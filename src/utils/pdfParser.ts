/**
 * Client-side PDF text extraction using PDF.js loaded from CDN.
 * Avoids Vite bundler issues by dynamically importing the library at runtime.
 *
 * Strategy:
 *  1. Load PDF.js from jsDelivr CDN (one-time, cached by browser).
 *  2. Parse the PDF ArrayBuffer page-by-page.
 *  3. Reconstruct text with line breaks preserved (paragraph-aware).
 *  4. Return the full extracted text plus a quality flag.
 *     - If average chars/page > TEXT_THRESHOLD, the PDF is text-rich.
 *     - Otherwise, it's likely scanned/image-only → caller should fallback to base64.
 */

// PDF.js CDN version — pinned for stability
const PDFJS_CDN = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/build/pdf.min.mjs";
const PDFJS_WORKER_CDN = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/build/pdf.worker.min.mjs";

/** Minimum average characters per page to consider the PDF text-extractable. */
const TEXT_THRESHOLD = 80;

export interface PDFExtractionResult {
  /** The full extracted plain text, pages separated by double newlines. */
  text: string;
  /** Total number of pages in the PDF. */
  pageCount: number;
  /** Average characters per page (used for quality assessment). */
  avgCharsPerPage: number;
  /** True if the PDF contains enough text to skip multimodal upload. */
  isTextRich: boolean;
}

// Cache the loaded library so we only fetch from CDN once per session.
let pdfjsLib: any = null;

async function loadPDFJS(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;

  try {
    const pdfjs = await import(/* @vite-ignore */ PDFJS_CDN);
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
    pdfjsLib = pdfjs;
    return pdfjs;
  } catch (err) {
    console.error("[pdfParser] Failed to load PDF.js from CDN:", err);
    throw new Error("Could not load the PDF parser library. Please check your network connection.");
  }
}

/**
 * Extract text from a PDF file's ArrayBuffer.
 * Returns the full text and a quality assessment.
 */
export async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<PDFExtractionResult> {
  const pdfjs = await loadPDFJS();

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];
  let totalChars = 0;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Reconstruct text with basic line-break awareness.
    // Items that end near the right margin or are followed by a large vertical
    // gap get a newline; otherwise they get a space.
    let pageText = "";
    let lastY: number | null = null;

    for (const item of textContent.items) {
      if (!("str" in item)) continue;
      const currentY = item.transform?.[5] ?? 0;

      if (lastY !== null && Math.abs(currentY - lastY) > 2) {
        // Vertical position changed → new line
        pageText += "\n";
      } else if (pageText.length > 0 && !pageText.endsWith("\n")) {
        pageText += " ";
      }

      pageText += item.str;
      lastY = currentY;
    }

    const trimmedPage = pageText.trim();
    if (trimmedPage) {
      pageTexts.push(trimmedPage);
      totalChars += trimmedPage.length;
    }
  }

  const avgCharsPerPage = pdf.numPages > 0 ? totalChars / pdf.numPages : 0;

  return {
    text: pageTexts.join("\n\n"),
    pageCount: pdf.numPages,
    avgCharsPerPage,
    isTextRich: avgCharsPerPage >= TEXT_THRESHOLD,
  };
}
