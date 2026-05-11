"use client";

/**
 * <MatierePanel>
 *
 * Panneau slide-in droite du flow "Mario Galaxy split-screen". Affiche le
 * briefing d'une matière. Itération [23:38] — composition ambitieuse :
 * watermark CLASSIFIED, header timestamp UTC live, code dossier avec
 * micro-glitch, numéro monumental, 3 sections diamants (signal /
 * télémétrie / méta), 3 mini-bargraphs (fenêtre/urgence/profondeur),
 * footer triple (signature agent + CTA enrichi).
 *
 * Le panneau est piloté de l'extérieur par `slug` + `isOpen` :
 *   - `slug=null` ou `isOpen=false` → état fermé (slide-out).
 *   - changement de `slug` pendant que le panneau est ouvert → swap avec
 *     cross-fade géré localement (state `bodyFading`).
 *
 * Pas de gestion du fly caméra ici — c'est le GraphSceneClient parent qui
 * sait ce qu'il fait avec la 3D.
 *
 * Styles dans `app/globals.css` (préfixe `.mg-panel__*`).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAnomalie, type AnomalieMeta, type Urgency } from "@/anomalies/registry";

interface MatierePanelProps {
  slug: string | null;
  isOpen: boolean;
  onClose: () => void;
}

/* ---------------------------------------------------------------
   Helpers de présentation — dérivation des barres de télémétrie
   --------------------------------------------------------------- */

/** Barre d'urgence ASCII (10 blocs) + couleur via CSS var + numérique. */
function urgencyView(urgency: Urgency): {
  bar: string;
  cssColor: string;
  label: string;
  numeric: string;
  fill: number;
} {
  const table: Record<Urgency, { fill: number; color: string }> = {
    imminent: { fill: 10, color: "var(--alert)" },
    "élevée": { fill: 7, color: "var(--rust)" },
    "modérée": { fill: 5, color: "var(--classified)" },
    stable: { fill: 3, color: "var(--phosphor-dim)" },
  };
  const { fill, color } = table[urgency];
  const bar = "█".repeat(fill) + "░".repeat(10 - fill);
  return {
    bar,
    cssColor: color,
    label: urgency,
    numeric: `${fill}.0/10`,
    fill,
  };
}

/** Fenêtre d'opportunité : map urgency → bar (l'urgence et la fenêtre sont
 *  corrélées — `imminent` = fenêtre presque fermée, `stable` = grande
 *  ouverte). On rend ça lisible avec un chiffre fictif `h restantes`. */
function windowView(urgency: Urgency, windowText: string): {
  bar: string;
  numeric: string;
  raw: string;
  fill: number;
} {
  const table: Record<Urgency, { fill: number; numeric: string }> = {
    imminent: { fill: 2, numeric: "≤ 72 h" },
    "élevée": { fill: 4, numeric: "≈ 1 sem" },
    "modérée": { fill: 6, numeric: "≈ 1 mois" },
    stable: { fill: 8, numeric: "indéfinie" },
  };
  const { fill, numeric } = table[urgency];
  const bar = "█".repeat(fill) + "░".repeat(10 - fill);
  return { bar, numeric, raw: windowText, fill };
}

/** Profondeur de strate : mapping basé sur le nom de la couche. */
function layerView(layer: string): {
  bar: string;
  numeric: string;
  fill: number;
} {
  const map: Record<string, number> = {
    Objet: 2,
    Système: 5,
    Mémoire: 7,
    Hardware: 9,
    Réseau: 4,
    Algorithme: 3,
  };
  const fill = map[layer] ?? 5;
  const bar = "█".repeat(fill) + "░".repeat(10 - fill);
  return { bar, numeric: `${fill}.0/10`, fill };
}

/* ---------------------------------------------------------------
   Glitch sur le code dossier — substitution éphémère d'un char
   --------------------------------------------------------------- */

const GLITCH_TABLE: Record<string, string[]> = {
  "0": ["O", "Q", "Ø"],
  "1": ["I", "l", "!"],
  "2": ["Z", "7"],
  "3": ["E", "8"],
  "4": ["A", "/"],
  "5": ["S", "$"],
  "6": ["G", "b"],
  "7": ["T", "?"],
  "8": ["B", "&"],
  "9": ["g", "P"],
};

/** Produit une version glitchée du code en remplaçant un char par un
 *  caractère visuellement proche. Retourne le code inchangé si pas
 *  de candidat. */
function glitchCode(code: string): string {
  if (code.length === 0) return code;
  const candidates: number[] = [];
  for (let i = 0; i < code.length; i++) {
    if (GLITCH_TABLE[code[i]]) candidates.push(i);
  }
  if (candidates.length === 0) return code;
  const i = candidates[Math.floor(Math.random() * candidates.length)];
  const subs = GLITCH_TABLE[code[i]];
  const sub = subs[Math.floor(Math.random() * subs.length)];
  return code.slice(0, i) + sub + code.slice(i + 1);
}

/* ---------------------------------------------------------------
   Timestamp UTC formaté HH:MM:SS — incrémenté toutes les secondes
   --------------------------------------------------------------- */

function formatUtc(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

/* =============================================================== */

export function MatierePanel({ slug, isOpen, onClose }: MatierePanelProps) {
  const router = useRouter();

  // On garde le dernier meta affichable pour ne pas faire flasher le contenu
  // pendant le slide-out. Init synchrone à `slug` pour le 1er frame.
  const [displayedSlug, setDisplayedSlug] = useState<string | null>(slug);
  const [bodyFading, setBodyFading] = useState(false);
  const fadeTimerRef = useRef<number | null>(null);
  const wasOpenRef = useRef(isOpen);
  const [isEntering, setIsEntering] = useState(false);
  const [showCaret, setShowCaret] = useState(false);
  const enterTimerRef = useRef<number | null>(null);
  const caretTimerRef = useRef<number | null>(null);

  // Timestamp UTC live (HH:MM:SS) — tick 1Hz. Figé si reduce-motion.
  const [now, setNow] = useState<string>(() => formatUtc(new Date()));
  // Code dossier avec glitch éphémère (chevauche meta.code). Reset à
  // chaque changement de slug. Figé si reduce-motion.
  const [glitchedCode, setGlitchedCode] = useState<string | null>(null);
  const glitchTimerRef = useRef<number | null>(null);

  // Sync `slug` → `displayedSlug`.
  useEffect(() => {
    if (slug === displayedSlug) {
      wasOpenRef.current = isOpen;
      return;
    }
    if (wasOpenRef.current && isOpen && displayedSlug !== null && slug !== null) {
      setBodyFading(true);
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
      }
      fadeTimerRef.current = window.setTimeout(() => {
        setDisplayedSlug(slug);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setBodyFading(false));
        });
      }, 120);
      wasOpenRef.current = isOpen;
      return;
    }
    if (slug !== null) {
      setDisplayedSlug(slug);
      setBodyFading(false);
    }
    wasOpenRef.current = isOpen;
  }, [slug, isOpen, displayedSlug]);

  // Esc handler.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Scan-sweep + caret + stagger fade-in sur transition fermé → ouvert.
  const prevIsOpenRef = useRef(isOpen);
  useEffect(() => {
    const wasOpen = prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;
    if (!isOpen || wasOpen) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    if (enterTimerRef.current !== null) {
      window.clearTimeout(enterTimerRef.current);
    }
    if (caretTimerRef.current !== null) {
      window.clearTimeout(caretTimerRef.current);
    }
    setIsEntering(true);
    setShowCaret(true);
    enterTimerRef.current = window.setTimeout(() => {
      enterTimerRef.current = null;
      setIsEntering(false);
    }, 1200);
    caretTimerRef.current = window.setTimeout(() => {
      caretTimerRef.current = null;
      setShowCaret(false);
    }, 2400);
  }, [isOpen]);

  // Tick UTC 1Hz quand le panneau est ouvert. Coupé en reduce-motion.
  useEffect(() => {
    if (!isOpen) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setInterval(() => {
      setNow(formatUtc(new Date()));
    }, 1000);
    return () => window.clearInterval(id);
  }, [isOpen]);

  // Glitch éphémère du code dossier toutes les 4-7s pour ~120ms.
  // Reset au changement de slug. Coupé en reduce-motion.
  useEffect(() => {
    if (!isOpen) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let cancelled = false;
    const scheduleGlitch = () => {
      if (cancelled) return;
      const wait = 4000 + Math.random() * 3000;
      glitchTimerRef.current = window.setTimeout(() => {
        if (cancelled) return;
        const meta = displayedSlug ? getAnomalie(displayedSlug) : undefined;
        if (!meta) {
          scheduleGlitch();
          return;
        }
        setGlitchedCode(glitchCode(meta.code));
        glitchTimerRef.current = window.setTimeout(() => {
          if (cancelled) return;
          setGlitchedCode(null);
          scheduleGlitch();
        }, 120);
      }, wait);
    };
    scheduleGlitch();
    return () => {
      cancelled = true;
      if (glitchTimerRef.current !== null) {
        window.clearTimeout(glitchTimerRef.current);
        glitchTimerRef.current = null;
      }
      setGlitchedCode(null);
    };
  }, [isOpen, displayedSlug]);

  // Cleanup global au démontage.
  useEffect(() => {
    return () => {
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
      }
      if (enterTimerRef.current !== null) {
        window.clearTimeout(enterTimerRef.current);
      }
      if (caretTimerRef.current !== null) {
        window.clearTimeout(caretTimerRef.current);
      }
      if (glitchTimerRef.current !== null) {
        window.clearTimeout(glitchTimerRef.current);
      }
    };
  }, []);

  const meta: AnomalieMeta | undefined = displayedSlug
    ? getAnomalie(displayedSlug)
    : undefined;

  // Dérivés mémoïsés — recalculés au changement de matière.
  const telemetry = useMemo(() => {
    if (!meta) return null;
    return {
      urgency: urgencyView(meta.urgency),
      window: windowView(meta.urgency, meta.window),
      layer: layerView(meta.layer),
    };
  }, [meta]);

  const handleCta = () => {
    if (!meta) return;
    router.push(`/anomalie/${meta.slug}`);
  };

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Code affiché : glitché ou normal. Le wrapper monospace garde
  // la largeur stable (police mono → pas de reflow sur substitution).
  const displayedCode = glitchedCode ?? meta?.code ?? "";

  return (
    <aside
      className={`mg-panel${isOpen ? " is-open" : ""}`}
      role="dialog"
      aria-modal="false"
      aria-label="Briefing matière"
      aria-hidden={!isOpen}
      inert={!isOpen}
      onClick={stop}
    >
      {meta && telemetry ? (
        <>
          {/* Background radar grid + watermark CLASSIFIED — décor pur. */}
          <div className="mg-panel__radar" aria-hidden="true" />
          <div className="mg-panel__watermark" aria-hidden="true">
            CLASSIFIED
          </div>

          {/* Scan-sweep diégétique à l'ouverture. */}
          {isEntering ? (
            <div className="mg-panel__scan" aria-hidden="true">
              <div className="mg-panel__scan-bar" />
            </div>
          ) : null}

          {/* ============== HEADER ============== */}
          <header className="mg-panel__header">
            <div className="mg-panel__topline">
              <span className="mg-panel__code-tag tracking-classified">
                <span className="mg-panel__code-dot" aria-hidden="true" />
                Dossier · <span className="mg-panel__code-mono">{displayedCode}</span> · {meta.domain}
              </span>
              <span className="mg-panel__hints">
                <span className="mg-panel__clock" aria-label="Heure UTC">
                  {now} <span className="mg-panel__clock-suffix">UTC</span>
                </span>
                <span className="mg-panel__esc">[esc]</span>
                <button
                  type="button"
                  className="mg-panel__close"
                  aria-label="Fermer le panneau"
                  onClick={onClose}
                >
                  ×
                </button>
              </span>
            </div>

            <div className="mg-panel__title-row">
              <span className="mg-panel__number" aria-hidden="true">
                {meta.code}
              </span>
              <h2
                className={`mg-panel__title${showCaret ? " caret" : ""}`}
              >
                {meta.title}
              </h2>
            </div>
          </header>

          {/* ============== BODY ============== */}
          <div
            className={
              "mg-panel__body" +
              (bodyFading ? " is-fading" : "") +
              (isEntering ? " is-entering" : "")
            }
          >
            <section className="mg-panel__section">
              <h3 className="mg-panel__section-label">
                <span className="mg-panel__diamond" aria-hidden="true">◇</span>
                Signal détecté
              </h3>
              <p className="mg-panel__symptom">{meta.symptom}</p>
            </section>

            <section className="mg-panel__section">
              <h3 className="mg-panel__section-label">
                <span className="mg-panel__diamond" aria-hidden="true">◇</span>
                Télémétrie
              </h3>
              <div className="mg-panel__telemetry">
                <div className="mg-panel__telemetry-row">
                  <span className="mg-panel__telemetry-key">Fenêtre</span>
                  <span
                    className="mg-panel__telemetry-bar"
                    style={
                      {
                        ["--mg-bar-fill" as string]:
                          `${telemetry.window.fill * 10}%`,
                        ["--mg-bar-color" as string]:
                          telemetry.window.fill <= 3
                            ? "var(--alert)"
                            : telemetry.window.fill <= 5
                              ? "var(--classified)"
                              : "var(--phosphor)",
                      } as React.CSSProperties
                    }
                  >
                    <span className="mg-panel__telemetry-bar-fill" />
                  </span>
                  <span className="mg-panel__telemetry-val">
                    {telemetry.window.numeric}
                  </span>
                </div>
                <div className="mg-panel__telemetry-row">
                  <span className="mg-panel__telemetry-key">Urgence</span>
                  <span
                    className="mg-panel__telemetry-bar"
                    style={
                      {
                        ["--mg-bar-fill" as string]:
                          `${telemetry.urgency.fill * 10}%`,
                        ["--mg-bar-color" as string]: telemetry.urgency.cssColor,
                      } as React.CSSProperties
                    }
                  >
                    <span className="mg-panel__telemetry-bar-fill" />
                  </span>
                  <span
                    className="mg-panel__telemetry-val mg-panel__telemetry-val--accent"
                    style={
                      {
                        ["--mg-val-color" as string]: telemetry.urgency.cssColor,
                      } as React.CSSProperties
                    }
                  >
                    {telemetry.urgency.label.toUpperCase()}
                  </span>
                </div>
                <div className="mg-panel__telemetry-row">
                  <span className="mg-panel__telemetry-key">Profondeur</span>
                  <span
                    className="mg-panel__telemetry-bar"
                    style={
                      {
                        ["--mg-bar-fill" as string]:
                          `${telemetry.layer.fill * 10}%`,
                        ["--mg-bar-color" as string]: "var(--seal)",
                      } as React.CSSProperties
                    }
                  >
                    <span className="mg-panel__telemetry-bar-fill" />
                  </span>
                  <span className="mg-panel__telemetry-val">
                    couche {telemetry.layer.fill}
                  </span>
                </div>
              </div>
            </section>

            <section className="mg-panel__section">
              <h3 className="mg-panel__section-label">
                <span className="mg-panel__diamond" aria-hidden="true">◇</span>
                Méta
              </h3>
              <dl className="mg-panel__meta-grid">
                <div className="mg-panel__meta-cell">
                  <dt>Strate</dt>
                  <dd>{meta.layer}</dd>
                </div>
                <div className="mg-panel__meta-cell">
                  <dt>Domaine</dt>
                  <dd>{meta.domain}</dd>
                </div>
                <div className="mg-panel__meta-cell mg-panel__meta-cell--wide">
                  <dt>Fenêtre brute</dt>
                  <dd>{meta.window}</dd>
                </div>
              </dl>
            </section>
          </div>

          {/* ============== FOOTER ============== */}
          <footer className="mg-panel__footer">
            <div className="mg-panel__signature" aria-hidden="true">
              <span className="mg-panel__sig-line">AGENT · 3A·F1</span>
              <span className="mg-panel__sig-line">L&apos;INTERPRÉTEUR</span>
              <span className="mg-panel__sig-line mg-panel__sig-line--dim">
                #ALX-2026
              </span>
            </div>
            <div className="mg-panel__cta-block">
              <button
                type="button"
                className="btn-int mg-panel__cta"
                data-variant="classified"
                onClick={handleCta}
              >
                Entrer dans la matière
              </button>
              <span className="mg-panel__cta-hint">
                ↵ entrer · esc revenir
              </span>
            </div>
          </footer>
        </>
      ) : null}
    </aside>
  );
}
