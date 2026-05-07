/**
 * Strip common Markdown markers so AI text renders clean.
 * Removes **, __, *, _, leading #, and `code` backticks while preserving content.
 */
export function cleanMarkdown(input: string): string {
  if (!input) return "";
  let s = input;
  // Remove code fences ``` ```
  s = s.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "");
  // Inline code `x`
  s = s.replace(/`([^`]+)`/g, "$1");
  // Bold **x** or __x__
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/__([^_]+)__/g, "$1");
  // Italic *x* or _x_
  s = s.replace(/(^|\s)\*([^*\n]+)\*/g, "$1$2").replace(/(^|\s)_([^_\n]+)_/g, "$1$2");
  // Headings ## Title
  s = s.replace(/^#{1,6}\s+/gm, "");
  // Bullets * / - / + at start → •
  s = s.replace(/^\s*[-*+]\s+/gm, "• ");
  // Numbered list keep as is
  // Blockquotes >
  s = s.replace(/^\s*>\s?/gm, "");
  // Collapse 3+ newlines
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}
