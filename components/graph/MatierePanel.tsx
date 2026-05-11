"use client";

/**
 * <MatierePanel>
 *
 * Panneau slide-in droite du flow "Mario Galaxy split-screen". Affiche le
 * briefing d'une matière (code, title, domain, symptom, window, layer,
 * urgency-bar) et expose un CTA `Entrer dans la matière` qui navigue vers
 * `/anomalie/<slug>`.
 *
 * Le panneau est piloté de l'extérieur par `slug` + `isOpen` :
 *   - `slug=null` ou `isOpen=false` → état fermé (slide-out).
 *   - changement de `slug` pendant que le panneau est ouvert → swap avec
 *     cross-fade géré localement (state `fadeKey` qui pulse `is-fading`).
 *
 * Pas de gestion du fly caméra ici — c'est le GraphSceneClient parent qui
 * sait ce qu'il fait avec la 3D.
 *
 * Styles dans `app/globals.css` (préfixe `.mg-panel__*`).
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAnomalie, type AnomalieMeta, type Urgency } from "@/anomalies/registry";

interface MatierePanelProps {
  slug: string | null;
  isOpen: boolean;
  onClose: () => void;
}

/** Barre d'urgence ASCII (8 blocs) + couleur via CSS var. */
function urgencyView(urgency: Urgency): {
  bar: string;
  cssColor: string;
  label: string;
} {
  const table: Record<Urgency, { fill: number; color: string }> = {
    imminent: { fill: 8, color: "var(--alert)" },
    "élevée": { fill: 6, color: "var(--rust)" },
    "modérée": { fill: 4, color: "var(--classified)" },
    stable: { fill: 2, color: "var(--phosphor-dim)" },
  };
  const { fill, color } = table[urgency];
  const bar = "█".repeat(fill) + "░".repeat(8 - fill);
  return { bar, cssColor: color, label: urgency };
}

export function MatierePanel({ slug, isOpen, onClose }: MatierePanelProps) {
  const router = useRouter();

  // On garde le dernier meta affichable pour ne pas faire flasher le contenu
  // pendant le slide-out (sinon, dès `slug=null`, on aurait un panneau vide
  // qui disparaît). `displayedSlug` = ce que le DOM montre actuellement.
  // Init synchrone à la valeur initiale de `slug` pour éviter un frame
  // perdu lors du premier slide-in (sinon : panneau slide vide puis le
  // contenu pop après l'effet — visuellement moche). (Fix audit I2.)
  const [displayedSlug, setDisplayedSlug] = useState<string | null>(slug);
  const [bodyFading, setBodyFading] = useState(false);
  const fadeTimerRef = useRef<number | null>(null);
  // Track de l'état "ouvert" précédent pour distinguer :
  //   - swap matière (était ouvert ET nouvel slug différent) → cross-fade ;
  //   - première ouverture depuis fermé (était fermé) → pas de cross-fade,
  //     swap immédiat + le slide-in CSS porte l'effet visuel.
  // (Fix audit I3 : sans ça, ouvrir B après avoir fermé A déclenchait un
  //  cross-fade indésirable au lieu d'un slide-in propre.)
  const wasOpenRef = useRef(isOpen);
  // True pendant le mount initial / l'ouverture : déclenche le scan-sweep
  // DOM (overlay 1100ms) + la classe `is-entering` sur le body (stagger
  // fade-in CSS), + le caret pulsant sur le titre pendant 2s.
  // Reset à false après 1200ms via setTimeout (avec cleanup).
  const [isEntering, setIsEntering] = useState(false);
  // True pendant les 2 premières secondes après l'ouverture : pose la
  // classe `caret` sur le titre. Retirée par setTimeout (cleanup ok).
  const [showCaret, setShowCaret] = useState(false);
  const enterTimerRef = useRef<number | null>(null);
  const caretTimerRef = useRef<number | null>(null);

  // Sync `slug` → `displayedSlug`.
  useEffect(() => {
    if (slug === displayedSlug) {
      wasOpenRef.current = isOpen;
      return;
    }

    // Cas swap : panneau ouvert au render précédent ET au render courant,
    // et le slug change. On cross-fade entre les deux contenus.
    if (wasOpenRef.current && isOpen && displayedSlug !== null && slug !== null) {
      setBodyFading(true);
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
      }
      fadeTimerRef.current = window.setTimeout(() => {
        setDisplayedSlug(slug);
        // Frame suivante : on enlève la classe is-fading → fade in CSS.
        // Double rAF assure que le browser a peint l'opacité=0 d'abord.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setBodyFading(false));
        });
      }, 120);
      wasOpenRef.current = isOpen;
      return;
    }

    // Cas ouverture initiale (panneau fermé → slug arrive) : on swap
    // immédiatement, le slide-in CSS portera l'effet visuel.
    if (slug !== null) {
      setDisplayedSlug(slug);
      setBodyFading(false);
    }
    // Cas fermeture (slug=null pendant fermeture) : on conserve le dernier
    // displayedSlug pour que le panneau slide out *avec* son contenu visible.
    wasOpenRef.current = isOpen;
  }, [slug, isOpen, displayedSlug]);

  // Esc handler — actif uniquement quand le panneau est ouvert.
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

  // Déclenchement scan-sweep + stagger fade-in + caret quand le panneau
  // passe de fermé à ouvert. Respect strict de `prefers-reduced-motion :
  // reduce` (gate les setTimeouts JS — le bloc CSS générique de
  // globals.css coupe déjà les durations CSS).
  const prevIsOpenRef = useRef(isOpen);
  useEffect(() => {
    const wasOpen = prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;
    // Ne déclenche que sur la transition fermé → ouvert (pas sur swap).
    if (!isOpen || wasOpen) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // En reduce-motion : pas de scan, pas de caret. Comme isEntering /
    // showCaret valent false par défaut (et le useEffect ne fire que sur
    // fermé→ouvert, jamais sur fermeture), on n'a rien à reset — on
    // retourne juste sans armer les timers.
    if (reduced) return;

    // Clear timers précédents : si l'utilisateur ferme puis rouvre à <2s,
    // les timers de la session précédente seraient encore actifs et
    // viendraient setShowCaret(false) au mauvais moment. (Fix audit CRIT #10.)
    if (enterTimerRef.current !== null) {
      window.clearTimeout(enterTimerRef.current);
    }
    if (caretTimerRef.current !== null) {
      window.clearTimeout(caretTimerRef.current);
    }
    setIsEntering(true);
    setShowCaret(true);
    // 1200ms ≈ durée du scan-sweep (1100ms) + un peu de marge ; on retire
    // ensuite la classe `is-entering` pour que le body ne re-anime pas si
    // le composant rerend.
    enterTimerRef.current = window.setTimeout(() => {
      enterTimerRef.current = null;
      setIsEntering(false);
    }, 1200);
    // Caret pulsant 2s puis disparaît.
    caretTimerRef.current = window.setTimeout(() => {
      caretTimerRef.current = null;
      setShowCaret(false);
    }, 2000);
  }, [isOpen]);

  // Cleanup des timers au démontage (évite fuite sur HMR / nav).
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
    };
  }, []);

  // Si on n'a jamais ouvert le panneau, on monte quand même la coquille
  // (transform: translateX(100%) gardé par CSS) pour pré-warm la transition.
  // Mais si displayedSlug est null *et* isOpen=false, on n'a rien à montrer.
  const meta: AnomalieMeta | undefined = displayedSlug
    ? getAnomalie(displayedSlug)
    : undefined;

  const handleCta = () => {
    if (!meta) return;
    router.push(`/anomalie/${meta.slug}`);
  };

  // Stop propagation : un click *dans* le panneau ne doit pas remonter au
  // click-outside listener du Canvas.
  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <aside
      className={`mg-panel${isOpen ? " is-open" : ""}`}
      role="dialog"
      aria-modal="false"
      aria-label="Briefing matière"
      aria-hidden={!isOpen}
      // `inert` quand fermé : retire le panneau du tab order ET de l'AT
      // (focus tab ne peut pas atteindre les boutons cachés derrière le
      // transform). React 19 + browsers modernes supportent l'attribut.
      // (Fix audit I4.)
      inert={!isOpen}
      onClick={stop}
    >
      {meta ? (
        <>
          {/* Scan-sweep diégétique : descend une fois verticalement à
              l'ouverture initiale. Présent dans le DOM uniquement
              pendant `isEntering` pour que la `animation` CSS soit
              re-déclenchée à chaque ouverture (mount/unmount). */}
          {isEntering ? (
            <div className="mg-panel__scan" aria-hidden="true">
              <div className="mg-panel__scan-bar" />
            </div>
          ) : null}

          <header className="mg-panel__header">
            <div className="mg-panel__topline">
              <span className="mg-panel__code tracking-classified">
                Briefing · Dossier {meta.code} · {meta.domain}
              </span>
              <span className="mg-panel__hints">
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
            {/* `caret` ajoute le ▌ pulsant via ::after CSS (1s steps(2)).
                Retiré après 2s via setShowCaret(false). */}
            <h2
              className={`mg-panel__title${showCaret ? " caret" : ""}`}
            >
              {meta.title}
            </h2>
          </header>

          <div
            className={
              "mg-panel__body" +
              (bodyFading ? " is-fading" : "") +
              (isEntering ? " is-entering" : "")
            }
            // tabIndex pour permettre overflow-scroll keyboard si besoin
          >
            <p className="mg-panel__symptom">{meta.symptom}</p>

            <div className="mg-panel__meta">
              <div>
                <span className="mg-panel__meta-label">Fenêtre d&apos;opportunité</span>
                <span className="mg-panel__meta-value">{meta.window}</span>
              </div>
              <div>
                <span className="mg-panel__meta-label">Couche du substrat</span>
                <span className="mg-panel__meta-value">{meta.layer}</span>
              </div>
            </div>

            <div className="mg-panel__urgency-row">
              <span className="mg-panel__meta-label">Niveau d&apos;urgence</span>
              {(() => {
                const u = urgencyView(meta.urgency);
                return (
                  <div>
                    <span
                      className="mg-panel__urgency-bar"
                      style={
                        {
                          // CSS var locale lue par .mg-panel__urgency-bar
                          ["--urgency-color" as string]: u.cssColor,
                        } as React.CSSProperties
                      }
                    >
                      {u.bar}
                    </span>
                    <span className="mg-panel__urgency-label">{u.label}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          <footer className="mg-panel__footer">
            <button
              type="button"
              className="btn-int mg-panel__cta"
              data-variant="classified"
              onClick={handleCta}
            >
              Entrer dans la matière
            </button>
          </footer>
        </>
      ) : null}
    </aside>
  );
}
