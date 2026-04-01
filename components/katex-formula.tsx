"use client";

import katex from "katex";
import { useMemo } from "react";

type Props = {
  /** KaTeX math string (no delimiters). */
  math: string;
  /** Block (display) vs inline. */
  display?: boolean;
  className?: string;
};

/**
 * Renders math with KaTeX. Import `katex/dist/katex.min.css` once (e.g. in root layout).
 */
export function KatexFormula({
  math,
  display = true,
  className = "",
}: Props) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: display,
        throwOnError: false,
        strict: "ignore",
      });
    } catch {
      return `<span class="text-rose-600">${escapeHtml(math)}</span>`;
    }
  }, [math, display]);

  if (display) {
    return (
      <div
        className={`overflow-x-auto py-1 text-center [&_.katex-display]:my-0 ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`inline-block align-baseline [&_.katex]:text-[0.95em] ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
