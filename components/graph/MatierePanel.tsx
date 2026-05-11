"use client";

/**
 * <MatierePanel> — composition éclatée
 *
 * Itération [23:53] — rupture de format. Plus de "panneau" unique à
 * droite. Le composant rend maintenant une **composition de cards
 * indépendantes** positionnées en grid avec décalages volontaires
 * (offsets latéraux, marges asymétriques) — chaque card est un objet
 * autonome avec son propre glass, ses propres bordures, sa propre
 * direction d'apparition.
 *
 * Cards (par ordre de cascade) :
 *   1. card-tag       — `• Dossier · 001 · TOB / 1SN` (haut-gauche)
 *   2. card-meta      — horloge UTC + esc + close (haut-droite)
 *   3. card-title     — numéro monumental + titre (large, clip-path coupé)
 *   4. card-signal    — symptôme dans blockquote (décalée droite)
 *   5. card-telemetry — 3 bargraphs animés (centrée)
 *   6. card-detail    — strate / domaine / fenêtre brute (décalée droite)
 *   7. card-agent     — signature 3 lignes (bas-gauche)
 *   8. card-cta       — bouton + hint retour (bas-droite)
 *
 * Le wrapper `.mg-panel` reste fixed top-right pour le slide-in global ;
 * `.mg-panel__layout` est une grid à 12 colonnes pour positionner les
 * cards. Plus de background global, plus de bordure gauche — c'est le
 * vide entre les cards qui montre le 3D derrière.
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
   Dérivations télémétrie
   --------------------------------------------------------------- */

function urgencyView(urgency: Urgency): {
  cssColor: string;
  label: string;
  fill: number;
} {
  const table: Record<Urgency, { fill: number; color: string }> = {
    imminent: { fill: 10, color: "var(--alert)" },
    "élevée": { fill: 7, color: "var(--rust)" },
    "modérée": { fill: 5, color: "var(--classified)" },
    stable: { fill: 3, color: "var(--phosphor-dim)" },
  };
  const { fill, color } = table[urgency];
  return { cssColor: color, label: urgency, fill };
}

function windowView(urgency: Urgency): { numeric: string; fill: number } {
  const table: Record<Urgency, { fill: number; numeric: string }> = {
    imminent: { fill: 2, numeric: "≤ 72 h" },
    "élevée": { fill: 4, numeric: "≈ 1 sem" },
    "modérée": { fill: 6, numeric: "≈ 1 mois" },
    stable: { fill: 8, numeric: "indéfinie" },
  };
  return table[urgency];
}

function layerView(layer: string): { fill: number } {
  const map: Record<string, number> = {
    Objet: 2,
    Système: 5,
    Mémoire: 7,
    Hardware: 9,
    Réseau: 4,
    Algorithme: 3,
  };
  return { fill: map[layer] ?? 5 };
}

/* ---------------------------------------------------------------
   Glitch éphémère sur le code
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

function formatUtc(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

/* =============================================================== */

export function MatierePanel({ slug, isOpen, onClose }: MatierePanelProps) {
  const router = useRouter();

  const [displayedSlug, setDisplayedSlug] = useState<string | null>(slug);
  const [bodyFading, setBodyFading] = useState(false);
  const fadeTimerRef = useRef<number | null>(null);
  const wasOpenRef = useRef(isOpen);
  const [isEntering, setIsEntering] = useState(false);
  const [showCaret, setShowCaret] = useState(false);
  const enterTimerRef = useRef<number | null>(null);
  const caretTimerRef = useRef<number | null>(null);

  const [now, setNow] = useState<string>(() => formatUtc(new Date()));
  const [glitchedCode, setGlitchedCode] = useState<string | null>(null);
  const glitchTimerRef = useRef<number | null>(null);

  // Sync slug → displayedSlug (avec cross-fade lors d'un swap).
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

  // Cascade entry + caret sur transition fermé → ouvert.
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
    // 1500ms = 8 cards × ~120ms cascade + marge.
    enterTimerRef.current = window.setTimeout(() => {
      enterTimerRef.current = null;
      setIsEntering(false);
    }, 1500);
    caretTimerRef.current = window.setTimeout(() => {
      caretTimerRef.current = null;
      setShowCaret(false);
    }, 2400);
  }, [isOpen]);

  // Tick UTC 1Hz quand le panneau est ouvert.
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

  // Glitch éphémère du code dossier.
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

  // Cleanup global.
  useEffect(() => {
    return () => {
      if (fadeTimerRef.current !== null) window.clearTimeout(fadeTimerRef.current);
      if (enterTimerRef.current !== null) window.clearTimeout(enterTimerRef.current);
      if (caretTimerRef.current !== null) window.clearTimeout(caretTimerRef.current);
      if (glitchTimerRef.current !== null) window.clearTimeout(glitchTimerRef.current);
    };
  }, []);

  const meta: AnomalieMeta | undefined = displayedSlug
    ? getAnomalie(displayedSlug)
    : undefined;

  const telemetry = useMemo(() => {
    if (!meta) return null;
    return {
      urgency: urgencyView(meta.urgency),
      window: windowView(meta.urgency),
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

  const displayedCode = glitchedCode ?? meta?.code ?? "";

  // Classe combinatoire des cards : pose `is-entering` pour cascade,
  // `is-fading` pour swap cross-fade.
  const layoutClasses =
    "mg-panel__layout" +
    (bodyFading ? " is-fading" : "") +
    (isEntering ? " is-entering" : "");

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
        <div className={layoutClasses}>
          {/* === CARD 1 : TAG (haut-gauche) ============================= */}
          <div className="mg-card mg-card--tag" data-card="tag">
            <span className="mg-card__corner mg-card__corner--tl" aria-hidden="true" />
            <span className="mg-card__corner mg-card__corner--br" aria-hidden="true" />
            <span className="mg-card__dot" aria-hidden="true" />
            <span className="mg-card__tag-text tracking-classified">
              Dossier · <span className="mg-card__tag-code">{displayedCode}</span> · {meta.domain}
            </span>
          </div>

          {/* === CARD 2 : META-CLOCK (haut-droite) ====================== */}
          <div className="mg-card mg-card--meta" data-card="meta">
            <span className="mg-card__clock">
              <span className="mg-card__clock-dot" aria-hidden="true">●</span>
              {now}
              <span className="mg-card__clock-suffix">UTC</span>
            </span>
            <span className="mg-card__esc">[esc]</span>
            <button
              type="button"
              className="mg-card__close"
              aria-label="Fermer le panneau"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          {/* === CARD 3 : TITLE (large, clip-path coupé) ================ */}
          <div className="mg-card mg-card--title" data-card="title">
            <span className="mg-card__number" aria-hidden="true">
              {meta.code}
            </span>
            <div className="mg-card__title-block">
              <span className="mg-card__title-pretitle tracking-classified">
                Matière classifiée
              </span>
              <h2
                className={`mg-card__title-text${showCaret ? " caret" : ""}`}
              >
                {meta.title}
              </h2>
            </div>
            {/* Bandeau latéral droit "OUVERT" — détail Mass Effect. */}
            <span className="mg-card__title-stripe" aria-hidden="true">
              OUVERT
            </span>
          </div>

          {/* === CARD 4 : SIGNAL (décalée droite) ======================= */}
          <div className="mg-card mg-card--signal" data-card="signal">
            <h3 className="mg-card__label">
              <span className="mg-card__diamond" aria-hidden="true">◇</span>
              Signal détecté
            </h3>
            <p className="mg-card__signal-body">{meta.symptom}</p>
          </div>

          {/* === CARD 5 : TÉLÉMÉTRIE (centrée) ========================== */}
          <div className="mg-card mg-card--telemetry" data-card="telemetry">
            <h3 className="mg-card__label">
              <span className="mg-card__diamond" aria-hidden="true">◇</span>
              Télémétrie
            </h3>
            <div className="mg-card__telemetry">
              <div className="mg-card__telemetry-row">
                <span className="mg-card__telemetry-key">Fenêtre</span>
                <span
                  className="mg-card__telemetry-bar"
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
                  <span className="mg-card__telemetry-bar-fill" />
                </span>
                <span className="mg-card__telemetry-val">
                  {telemetry.window.numeric}
                </span>
              </div>
              <div className="mg-card__telemetry-row">
                <span className="mg-card__telemetry-key">Urgence</span>
                <span
                  className="mg-card__telemetry-bar"
                  style={
                    {
                      ["--mg-bar-fill" as string]:
                        `${telemetry.urgency.fill * 10}%`,
                      ["--mg-bar-color" as string]: telemetry.urgency.cssColor,
                    } as React.CSSProperties
                  }
                >
                  <span className="mg-card__telemetry-bar-fill" />
                </span>
                <span
                  className="mg-card__telemetry-val mg-card__telemetry-val--accent"
                  style={
                    {
                      ["--mg-val-color" as string]: telemetry.urgency.cssColor,
                    } as React.CSSProperties
                  }
                >
                  {telemetry.urgency.label.toUpperCase()}
                </span>
              </div>
              <div className="mg-card__telemetry-row">
                <span className="mg-card__telemetry-key">Profondeur</span>
                <span
                  className="mg-card__telemetry-bar"
                  style={
                    {
                      ["--mg-bar-fill" as string]:
                        `${telemetry.layer.fill * 10}%`,
                      ["--mg-bar-color" as string]: "var(--seal)",
                    } as React.CSSProperties
                  }
                >
                  <span className="mg-card__telemetry-bar-fill" />
                </span>
                <span className="mg-card__telemetry-val">
                  couche {telemetry.layer.fill}
                </span>
              </div>
            </div>
          </div>

          {/* === CARD 6 : DETAIL (décalée droite) ======================= */}
          <div className="mg-card mg-card--detail" data-card="detail">
            <dl className="mg-card__detail-grid">
              <div>
                <dt>Strate</dt>
                <dd>{meta.layer}</dd>
              </div>
              <div>
                <dt>Domaine</dt>
                <dd>{meta.domain}</dd>
              </div>
              <div className="mg-card__detail-wide">
                <dt>Fenêtre brute</dt>
                <dd>{meta.window}</dd>
              </div>
            </dl>
          </div>

          {/* === CARD 7 : AGENT (bas-gauche) ============================ */}
          <div className="mg-card mg-card--agent" data-card="agent">
            <span className="mg-card__sig-line">AGENT · 3A·F1</span>
            <span className="mg-card__sig-line">L&apos;INTERPRÉTEUR</span>
            <span className="mg-card__sig-line mg-card__sig-line--dim">
              #ALX-2026
            </span>
          </div>

          {/* === CARD 8 : CTA (bas-droite) ============================== */}
          <div className="mg-card mg-card--cta" data-card="cta">
            <button
              type="button"
              className="btn-int mg-card__cta-btn"
              data-variant="classified"
              onClick={handleCta}
            >
              Entrer dans la matière
            </button>
            <span className="mg-card__cta-hint">
              ↵ entrer · esc revenir
            </span>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
