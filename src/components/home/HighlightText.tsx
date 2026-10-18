/** 把文字中的 highlight 片段以品牌黃色標示（找不到時原樣輸出） */
export default function HighlightText({ text, highlight }: { text: string; highlight?: string }) {
  const index = highlight ? text.indexOf(highlight) : -1;
  if (!highlight || index < 0) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <span className="inline-block whitespace-nowrap text-secondary">{highlight}</span>
      {text.slice(index + highlight.length)}
    </>
  );
}
