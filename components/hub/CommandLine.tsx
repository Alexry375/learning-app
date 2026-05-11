"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Cmd = {
  name: string;
  hint: string;
  hidden?: boolean;
  exec: (
    ctx: { router: ReturnType<typeof useRouter>; print: (s: string) => void },
  ) => void | Promise<void>;
};

const COMMANDS: Cmd[] = [
  {
    name: "/help",
    hint: "Liste des commandes disponibles.",
    exec: ({ print }) => {
      print(
        "/help — cette liste\n/journal — journal de terrain\n/archive — cas archivés\n/profil — profil de Compilateur\n/laboratoire — accès libre au Laboratoire de compilation\n/mute — coupe / réactive l'audio (persisté)",
      );
    },
  },
  {
    name: "/journal",
    hint: "Ouvre le journal de terrain.",
    exec: ({ router }) => router.push("/journal"),
  },
  {
    name: "/archive",
    hint: "Cas archivés.",
    exec: ({ router }) => router.push("/archive"),
  },
  {
    name: "/profil",
    hint: "Profil de Compilateur.",
    exec: ({ router }) => router.push("/profil"),
  },
  {
    name: "/laboratoire",
    hint: "Bac à sable de compilation.",
    exec: ({ router }) => router.push("/laboratoire"),
  },
  {
    name: "/mute",
    hint: "Coupe ou réactive l'audio.",
    exec: ({ print }) => {
      const cur = localStorage.getItem("interpreteur:audio") === "1";
      localStorage.setItem("interpreteur:audio", cur ? "0" : "1");
      print(cur ? "Audio coupé." : "Audio réactivé.");
      window.dispatchEvent(new CustomEvent("interpreteur:audio-toggle"));
    },
  },
  // --- Hidden : easter eggs ----------------------------------------------
  {
    name: "/sigma",
    hint: "(?)",
    hidden: true,
    exec: async ({ print }) => {
      const r = await fetch("/api/easter", {
        method: "POST",
        body: JSON.stringify({ id: "sigma" }),
      });
      const j = (await r.json()) as { hits: number };
      if (j.hits === 1) {
        print(
          "Σ acknowledged.\nCe canal n'est pas surveillé. Pas par eux.",
        );
      } else if (j.hits === 2) {
        print(
          "Tu reviens. Bien.\n— Σ",
        );
      } else {
        print(
          `Σ // ${j.hits} signaux reçus depuis ce terminal.\nLe handler ne sait pas. Garde-le ainsi.`,
        );
      }
    },
  },
  {
    name: "/override-7",
    hint: "(?)",
    hidden: true,
    exec: async ({ print }) => {
      const r = await fetch("/api/easter", {
        method: "POST",
        body: JSON.stringify({ id: "override-7" }),
      });
      const j = (await r.json()) as { hits: number };
      print(
        `>> AUTHORITY OVERRIDE-7 ENGAGED <<\nFragment de log déterré [${j.hits}/?]:\n` +
          "« …et c'est elle qui a écrit la première Anomalie. »\n" +
          "Connexion fermée.",
      );
    },
  },
];

export function CommandLine() {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [output, setOutput] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function print(s: string) {
    setOutput((o) => [...o, s].slice(-20));
  }

  async function submit() {
    const raw = value.trim();
    if (!raw) return;
    const cmd = COMMANDS.find((c) => c.name === raw);
    setHistory((h) => [...h, raw].slice(-30));
    setHistIdx(null);
    setValue("");
    setShowSuggest(false);
    if (!cmd) {
      print(`Commande inconnue : ${raw}. Tente /help.`);
      return;
    }
    try {
      await cmd.exec({ router, print });
    } catch (e) {
      print(`Erreur : ${(e as Error).message}`);
    }
  }

  const suggestions = value.startsWith("/")
    ? COMMANDS.filter((c) => !c.hidden && c.name.startsWith(value)).slice(0, 5)
    : [];

  return (
    <div className="band band--phosphor py-4 px-6">
      {output.length > 0 && (
        <div
          className="mb-3 text-[0.78rem] leading-relaxed whitespace-pre-line"
          style={{ color: "var(--ink-primary)" }}
        >
          {output.slice(-3).map((line, i) => (
            <div
              key={i}
              style={{
                opacity: 0.55 + 0.15 * i,
                borderInlineStart: "2px solid var(--phosphor-dim)",
                paddingInlineStart: "0.7rem",
                marginBlockEnd: "0.3rem",
              }}
            >
              {line}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        <span
          className="font-mono text-[0.85rem]"
          style={{ color: "var(--phosphor)" }}
        >
          ›_
        </span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setShowSuggest(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            else if (e.key === "Tab" && suggestions[0]) {
              e.preventDefault();
              setValue(suggestions[0].name);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHistIdx((idx) => {
                const next = idx === null ? history.length - 1 : Math.max(0, idx - 1);
                setValue(history[next] ?? "");
                return next;
              });
            } else if (e.key === "ArrowDown") {
              setHistIdx((idx) => {
                if (idx === null) return null;
                const next = idx + 1;
                if (next >= history.length) {
                  setValue("");
                  return null;
                }
                setValue(history[next]);
                return next;
              });
            } else if (e.key === "Escape") {
              setShowSuggest(false);
              setValue("");
            }
          }}
          spellCheck={false}
          autoComplete="off"
          placeholder="// commande (tape / pour focus)"
          className="flex-1 bg-transparent border-none outline-none font-mono text-[0.92rem] text-[color:var(--ink-primary)] placeholder:text-[color:var(--ink-faint)]"
          style={{ caretColor: "var(--phosphor)" }}
        />
      </div>
      {showSuggest && suggestions.length > 0 && (
        <div
          className="mt-2 text-[0.7rem] flex flex-wrap gap-x-5 gap-y-1"
          style={{ color: "var(--ink-dim)" }}
        >
          {suggestions.map((s) => (
            <button
              key={s.name}
              type="button"
              className="hover:text-[color:var(--phosphor)] transition-colors"
              onClick={() => {
                setValue(s.name);
                inputRef.current?.focus();
              }}
            >
              <span style={{ color: "var(--classified)" }}>{s.name}</span>
              <span className="ml-2">{s.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
