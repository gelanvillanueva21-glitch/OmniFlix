/**
 * Minimal, dependency-free HTML-to-text normalization.
 *
 * Provider synopses (LNcrawl, Suwayomi, …) frequently arrive wrapped in
 * markup such as `<p><html><body>…</body></html></p>`, sometimes repeated
 * per paragraph. This module turns those into readable plain text so the
 * UI never has to strip tags at render time — descriptions are always
 * rendered as React text nodes, never via `dangerouslySetInnerHTML`.
 */

const NAMED_ENTITIES: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
};

/** Decode numeric (&#39; &#x27;) and common named HTML entities. */
function decodeEntities(text: string): string {
  return text.replace(
    /&(?:#x([0-9a-f]+)|#(\d+)|([a-z]+));/gi,
    (
        _match, 
        hex?: string, 
        decimal?: string, 
        name?: string
    ) => {
        if (hex !== undefined) {
            const code = Number.parseInt(hex, 16);
            return Number.isFinite(code) ? String.fromCodePoint(code) : _match;
        }
        if (decimal !== undefined) {
            const code = Number.parseInt(decimal, 10);
            return Number.isFinite(code) ? String.fromCodePoint(code) : _match;
        }
        return name ? (NAMED_ENTITIES[name.toLowerCase()] ?? _match) : _match;
    },
  );
}

/**
 * Convert arbitrary HTML (including malformed/nested wrappers like
 * `<p><html><body>…`) to trimmed, whitespace-collapsed plain text.
 * Block-level tags become paragraph breaks; everything else is stripped.
 * Safely returns an empty string for empty/null/undefined input.
 */
export function htmlToText(html: string | null | undefined): string {
    if (!html) return "";

    // Block-level boundaries become newlines before tags are stripped,
    // so consecutive paragraphs stay visually separated.
    const withBreaks = html.replace(
        /<\/(?:p|div|br|li|h[1-6]|tr)\s*>|<br\s*\/?>/gi,
        "\n",
    );

    const text = decodeEntities(withBreaks.replace(/<[^>]*>/g, ""));

    return text
        .split("\n")
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter((line) => line.length > 0)
        .join("\n");
}
