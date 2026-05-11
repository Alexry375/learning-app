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

  // Cleanup du timer cross-fade au démontage (évite fuite sur HMR).
  useEffect(() => {
    return () => {
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
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
          <header className="mg-panel__header">
            <div className="mg-panel__topline">
              <span className="mg-panel__code tracking-classified">
                Dossier {meta.code} · {meta.domain}
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
            <h2 className="mg-panel__title">{meta.title}</h2>
          </header>

          <div
            className={`mg-panel__body${bodyFading ? " is-fading" : ""}`}
            // tabIndex pour permettre overflow-scroll keyboard si besoin
          >
            <p className="mg-panel__symptom">{meta.symptom}</p>

            <div className="mg-panel__meta">
              <div>
                <span className="mg-panel__meta-label">Fenêtre</span>
                <span className="mg-panel__meta-value">{meta.window}</span>
              </div>
              <div>
                <span className="mg-panel__meta-label">Couche</span>
                <span className="mg-panel__meta-value">{meta.layer}</span>
              </div>
            </div>

            <div className="mg-panel__urgency-row">
              <span className="mg-panel__meta-label">Urgence</span>
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
