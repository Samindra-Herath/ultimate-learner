export function stripMarkdown(md: string): string {
  if (!md) return "";
  return md
    // Remove headings and replace with just the text
    .replace(/^#{1,6}\s+(.*)/gm, "$1")
    // Remove bold and italic (using * or _)
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Remove strikethrough
    .replace(/~~(.*?)~~/g, "$1")
    // Remove inline code
    .replace(/`(.*?)`/g, "$1")
    // Replace code blocks with just the content (strip ```language)
    .replace(/```[\w-]*\n([\s\S]*?)```/g, "$1")
    // Remove images
    .replace(/!\[(.*?)\]\(.*?\)/g, "$1")
    // Remove links but keep the text
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    // Remove blockquotes (>)
    .replace(/^\s*>\s+/gm, "")
    // Replace unordered lists with bullets
    .replace(/^\s*[-+*]\s+/gm, "• ")
    // Clean up multiple newlines to max two
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
