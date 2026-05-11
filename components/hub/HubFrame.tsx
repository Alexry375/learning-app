import Link from "next/link";
import { CRT } from "@/components/shared/CRT";
import { StatusBar } from "@/components/hub/StatusBar";
import { getAgent } from "@/lib/db";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function HubFrame({ title, subtitle, children }: Props) {
  const agent = getAgent();
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-void)" }}
    >
      <CRT />
      <StatusBar handle={agent.handle} clearance={agent.clearance} />
      <section className="band band--phosphor px-6 py-3 flex items-baseline justify-between gap-4">
        <div>
          <h1
            className="font-mono text-[0.78rem] tracking-classified"
            style={{ color: "var(--ink-primary)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="font-mono text-[0.62rem] tracking-classified"
              style={{ color: "var(--ink-faint)" }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <Link
          href="/"
          className="text-[0.62rem] tracking-classified hover:text-[color:var(--phosphor)] transition-colors"
          style={{ color: "var(--ink-dim)" }}
        >
          ‹ RETOUR&nbsp;TERMINAL
        </Link>
      </section>
      <div className="flex-1 px-6 lg:px-12 py-10 max-w-5xl w-full mx-auto">
        {children}
      </div>
    </main>
  );
}
