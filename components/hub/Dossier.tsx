"use client";

import Link from "next/link";
import type { AnomalieMeta, AnomalieStatus } from "@/anomalies/registry";
import { motion } from "motion/react";

const URGENCY_COLOR: Record<string, string> = {
  imminent: "var(--alert)",
  "élevée": "var(--classified)",
  "modérée": "var(--phosphor)",
  stable: "var(--ink-dim)",
};

const STATUS_LABEL: Record<AnomalieStatus, string> = {
  open: "OUVERT",
  in_progress: "EN COURS",
  resolved: "RÉSOLU",
  partial: "PARTIEL",
};

const STATUS_COLOR: Record<AnomalieStatus, string> = {
  open: "var(--alert)",
  in_progress: "var(--classified)",
  resolved: "var(--phosphor)",
  partial: "var(--seal)",
};

type Props = {
  meta: AnomalieMeta;
  status: AnomalieStatus;
};

export function Dossier({ meta, status }: Props) {
  const urgencyColor = URGENCY_COLOR[meta.urgency] ?? "var(--ink-dim)";
  const statusColor = STATUS_COLOR[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/anomalie/${meta.slug}`}
        className="dossier block no-underline text-inherit"
        prefetch={false}
      >
        <div className="dossier__seal">
          <span style={{ color: "var(--seal)" }}>⟨ Ω ⟩</span>
          <span className="ml-3" style={{ color: statusColor }}>
            {STATUS_LABEL[status]}
          </span>
        </div>

        <div className="flex items-baseline gap-4 mb-2">
          <span
            className="font-mono text-[0.7rem] tracking-classified"
            style={{ color: "var(--ink-faint)" }}
          >
            DOSSIER
          </span>
          <span
            className="font-mono text-[1.6rem] tabular-nums"
            style={{ color: "var(--classified)" }}
          >
            {meta.code}
          </span>
          <span
            className="font-mono text-[0.65rem] tracking-classified ml-auto"
            style={{ color: urgencyColor }}
          >
            {meta.urgency.toUpperCase()}
          </span>
        </div>

        <h2 className="font-mono text-[1.35rem] mb-2 leading-tight">
          {meta.title}
        </h2>

        <div
          className="flex flex-wrap gap-3 text-[0.68rem] tracking-classified"
          style={{ color: "var(--ink-dim)" }}
        >
          <span>COUCHE&nbsp;
            <span style={{ color: "var(--phosphor)" }}>{meta.layer}</span>
          </span>
          <span style={{ color: "var(--ink-faint)" }}>·</span>
          <span>{meta.domain}</span>
          <span style={{ color: "var(--ink-faint)" }}>·</span>
          <span>{meta.window}</span>
        </div>

        <div className="dossier__preview mt-3">
          <p
            className="text-[0.86rem] leading-relaxed pt-3"
            style={{
              color: "var(--ink-primary)",
              borderTop: "1px solid var(--rule)",
            }}
          >
            {meta.symptom}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
