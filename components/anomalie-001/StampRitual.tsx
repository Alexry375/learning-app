"use client";

import { motion } from "motion/react";

type Props = { label: string; keyId: string };

export function StampRitual({ label, keyId }: Props) {
  return (
    <motion.div
      key={keyId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[120] pointer-events-none flex items-center justify-center"
      style={{ background: "rgba(7, 4, 2, 0.6)" }}
    >
      <div className="stamp">{label}</div>
    </motion.div>
  );
}
