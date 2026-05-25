/**
 * Lightweight markdown-ish formatter for AI assistant messages.
 * Port of the Angular admin's formatMessage helper.
 *
 * Supports: bold (**), italic (*), inline code (`), # ## ### headings,
 *           --- horizontal rule, | pipe tables, and newline breaks.
 *
 * Output: HTML safe-ish — input is escaped first.
 */
export function formatAiMessage(text: string): string {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Bold (must run before italic)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">$1</code>'
    )
    // Headers
    .replace(
      /^### (.+)$/gm,
      '<h6 class="mt-2 mb-1 text-[13px] font-semibold text-foreground">$1</h6>'
    )
    .replace(
      /^## (.+)$/gm,
      '<h5 class="mt-3 mb-1 text-[14px] font-semibold text-foreground">$1</h5>'
    )
    .replace(
      /^# (.+)$/gm,
      '<h4 class="mt-3 mb-2 text-[15px] font-semibold text-foreground">$1</h4>'
    )
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="my-2 border-border-light">')
    // Table rows: capture lines that start AND end with pipes
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split("|").filter((c) => c.trim());
      // Header separator like |---|---|
      if (cells.every((c) => /^[\s\-:]+$/.test(c))) return "<!--table-sep-->";
      const cellHtml = cells
        .map(
          (c) =>
            `<td class="border border-border-light px-2 py-1">${c.trim()}</td>`
        )
        .join("");
      return `<tr>${cellHtml}</tr>`;
    });

  // Wrap consecutive table rows in <table>
  html = html.replace(/((?:<tr>.*<\/tr>\n?)+)/g, (match) => {
    const cleaned = match.replace(/<!--table-sep-->\n?/g, "");
    if (!cleaned.trim()) return "";
    const rows = cleaned.trim().split("\n").filter((r) => r.trim());
    if (rows.length === 0) return "";
    const headerRow = rows[0]
      .replace(/<td/g, "<th")
      .replace(/<\/td>/g, "</th>");
    const bodyRows = rows.slice(1).join("\n");
    return `<div class="my-2 overflow-x-auto"><table class="w-full border-collapse text-[12px]"><thead class="bg-muted">${headerRow}</thead><tbody>${bodyRows}</tbody></table></div>`;
  });

  // Newlines → <br>
  html = html.replace(/\n/g, "<br>");
  // Tidy <br> around block elements
  html = html.replace(/<br>\s*(<h[456]|<hr|<div|<table)/g, "$1");
  html = html.replace(/(<\/h[456]>|<\/div>|<\/table>)\s*<br>/g, "$1");
  return html;
}
