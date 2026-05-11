import type {
  ValidationRule,
  OpenTextValidation,
} from "./cell-types";

export type RunSummary = {
  compileOk: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  exitSignalName: string | null;
};

export function validate(rule: ValidationRule, run: RunSummary): {
  ok: boolean;
  reason?: string;
} {
  switch (rule.type) {
    case "stdout-equals": {
      const a = run.stdout;
      const b = rule.expected;
      if (a === b) return { ok: true };
      return {
        ok: false,
        reason: `stdout attendu (strict):\n${quote(b)}\n\nstdout obtenu:\n${quote(a)}`,
      };
    }
    case "stdout-contains": {
      const missing = rule.substrings.filter((s) => !run.stdout.includes(s));
      if (missing.length === 0) return { ok: true };
      return {
        ok: false,
        reason: `stdout doit contenir : ${missing.map((m) => `"${m}"`).join(", ")}`,
      };
    }
    case "stdout-matches": {
      const re = new RegExp(rule.pattern, rule.flags ?? "");
      if (re.test(run.stdout)) return { ok: true };
      return {
        ok: false,
        reason: `stdout doit matcher /${rule.pattern}/${rule.flags ?? ""}`,
      };
    }
    case "exit-code": {
      if (run.exitCode === rule.code) return { ok: true };
      return {
        ok: false,
        reason: `exit code attendu ${rule.code}, obtenu ${run.exitCode ?? `signal ${run.exitSignalName}`}`,
      };
    }
    case "exit-signal": {
      if (run.exitSignalName === rule.signalName) return { ok: true };
      return {
        ok: false,
        reason: `signal de mort attendu ${rule.signalName}, obtenu ${run.exitSignalName ?? `exit ${run.exitCode}`}`,
      };
    }
    case "stderr-empty": {
      if (run.stderr.trim().length === 0) return { ok: true };
      return { ok: false, reason: "stderr non vide" };
    }
    case "compile-ok": {
      if (run.compileOk) return { ok: true };
      return { ok: false, reason: "compilation refusée" };
    }
    case "and": {
      for (const r of rule.rules) {
        const v = validate(r, run);
        if (!v.ok) return v;
      }
      return { ok: true };
    }
    case "or": {
      let lastReason = "aucune sous-règle ne passe";
      for (const r of rule.rules) {
        const v = validate(r, run);
        if (v.ok) return { ok: true };
        if (v.reason) lastReason = v.reason;
      }
      return { ok: false, reason: lastReason };
    }
  }
}

export function validateOpenText(
  rule: OpenTextValidation,
  input: string,
): { ok: boolean; reason?: string } {
  const trimmed = input.trim();
  switch (rule.type) {
    case "equals-int": {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || Math.floor(n) !== n) {
        return { ok: false, reason: "réponse attendue : un entier" };
      }
      if (n === rule.value) return { ok: true };
      return { ok: false, reason: "valeur incorrecte" };
    }
    case "equals-string": {
      const a = rule.ci ? trimmed.toLowerCase() : trimmed;
      const b = rule.ci ? rule.value.toLowerCase() : rule.value;
      if (a === b) return { ok: true };
      return { ok: false, reason: "réponse incorrecte" };
    }
    case "matches": {
      const re = new RegExp(rule.pattern, rule.flags ?? "");
      if (re.test(trimmed)) return { ok: true };
      return { ok: false, reason: "réponse hors forme attendue" };
    }
  }
}

function quote(s: string): string {
  return s
    .split("\n")
    .map((l) => "  │ " + l)
    .join("\n");
}
