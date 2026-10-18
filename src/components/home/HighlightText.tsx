const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 把文字中的 highlight 片段（可多個）以品牌黃色標示；找不到時原樣輸出 */
export default function HighlightText({ text, highlight }: { text: string; highlight?: string | string[] }) {
  const highlights = (Array.isArray(highlight) ? highlight : highlight ? [highlight] : []).filter(Boolean);
  if (highlights.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${highlights.map(escapeRegExp).join("|")})`, "g");
  return (
    <>
      {text.split(pattern).map((part, index) =>
        highlights.includes(part) ? (
          <span key={index} className="inline-block whitespace-nowrap text-secondary">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}
