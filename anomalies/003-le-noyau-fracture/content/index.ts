import { TP1 } from "./tp1/cells";
import { TP2 } from "./tp2/cells";
import { TP3 } from "./tp3/cells";
import type { TPContent } from "./cell-types";

export const TP_CONTENT: Record<string, TPContent> = {
  tp1: TP1,
  tp2: TP2,
  tp3: TP3,
};

export function getTPContent(tpId: string): TPContent | undefined {
  return TP_CONTENT[tpId];
}
