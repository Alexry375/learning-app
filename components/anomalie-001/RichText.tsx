import type { CSSProperties } from "react";

const RE = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;

const codeStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  color: "var(--amber)",
  background: "rgba(7, 4, 2, 0.5)",
  padding: "0.05rem 0.35rem",
  fontSize: "0.92em",
  borderRadius: "1px",
};

export function RichText({ children }: { children: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = RE.exec(children)) !== null) {
    if (m.index > last) out.push(children.slice(last, m.index));
    const v = m[0];
    if (v.startsWith("**")) out.push(<strong key={key++}>{v.slice(2, -2)}</strong>);
    else if (v.startsWith("`")) out.push(<code key={key++} style={codeStyle}>{v.slice(1, -1)}</code>);
    else out.push(<em key={key++}>{v.slice(1, -1)}</em>);
    last = m.index + v.length;
  }
  if (last < children.length) out.push(children.slice(last));
  return <>{out}</>;
}
