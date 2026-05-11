import Link from "next/link";
import "../../globals.css";

export default function AnomalieLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  // params est une Promise dans Next.js 16 ; on lit côté client via children.
  // On garde ici juste l'envelope visuelle.
  return (
    <div data-anomalie="001" className="min-h-screen relative">
      {/* Bouton sortie discret en haut */}
      <Link
        href="/"
        prefetch={false}
        className="fixed top-3 right-4 z-[80] text-[0.62rem] tracking-classified px-3 py-1 border border-[color:var(--ink-paper-dim)] hover:border-[color:var(--amber)] hover:text-[color:var(--amber)] transition-colors"
        style={{ color: "var(--ink-paper-dim)", background: "var(--paper)" }}
      >
        ‹ SORTIR&nbsp;DU&nbsp;DOSSIER
      </Link>
      {children}
    </div>
  );
}
