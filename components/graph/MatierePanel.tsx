"use client";

/**
 * <MatierePanel> — annotation cartographique
 *
 * Itération [23:54] — rupture de format radicale. Plus de panneau, plus
 * de boîte, plus de glass, plus de cadre. Le composant devient une
 * **annotation cartographique** posée dans l'espace : un fin trait part
 * du bord gauche (où la bulle finit, après le fly-to-NDC=-0.62) et
 * pointe vers le titre de la matière en typographie monumentale, qui
 * flotte directement sur le canvas 3D iridescent.
 *
 * Référence : légende d'atlas astronomique, schéma scientifique annoté,
 * carton de titre Saul Bass, exposition typographique.
 *
 * Contenu : code dossier (compact), titre (énorme, révélé mot par mot),
 * lien-CTA souligné (pas un bouton-boîte). Rien d'autre.
 *
 * Le composant est piloté de l'extérieur par `slug` + `isOpen`. Au
 * changement de slug ouvert, on `key={slug}` les éléments animés pour
 * forcer un remount → re-déclenchement des animations CSS.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAnomalie, type AnomalieMeta } from "@/anomalies/registry";

interface MatierePanelProps {
  slug: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MatierePanel({ slug, isOpen, onClose }: MatierePanelProps) {
  const router = useRouter();

  // On garde le dernier meta affichable pour que le fade-out global de
  // l'annotation se fasse *avec* son contenu visible. Sinon, dès slug=null,
  // le contenu disparaît avant la fin du fade.
  const [displayedSlug, setDisplayedSlug] = useState<string | null>(slug);
  const fadeOutTimerRef = useRef<number | null>(null);

  // Sync slug → displayedSlug avec délai à la fermeture pour laisser le
  // fade-out global de `.mg-anno` se jouer (~360ms).
  useEffect(() => {
    if (slug === displayedSlug) return;

    if (slug === null) {
      // Fermeture : on garde displayedSlug pendant 360ms (durée du fade-out),
      // puis on le nullifie pour ne pas laisser de DOM zombie.
      if (fadeOutTimerRef.current !== null) {
        window.clearTimeout(fadeOutTimerRef.current);
      }
      fadeOutTimerRef.current = window.setTimeout(() => {
        setDisplayedSlug(null);
        fadeOutTimerRef.current = null;
      }, 360);
      return;
    }

    // Ouverture ou swap : on remplace immédiatement displayedSlug. Le `key`
    // sur les éléments animés ci-dessous force leur remount → les keyframes
    // CSS re-jouent depuis 0%.
    if (fadeOutTimerRef.current !== null) {
      window.clearTimeout(fadeOutTimerRef.current);
      fadeOutTimerRef.current = null;
    }
    setDisplayedSlug(slug);
  }, [slug, displayedSlug]);

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

  // Cleanup global.
  useEffect(() => {
    return () => {
      if (fadeOutTimerRef.current !== null) {
        window.clearTimeout(fadeOutTimerRef.current);
      }
    };
  }, []);

  const meta: AnomalieMeta | undefined = displayedSlug
    ? getAnomalie(displayedSlug)
    : undefined;

  const handleCta = () => {
    if (!meta) return;
    router.push(`/anomalie/${meta.slug}`);
  };

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Split du titre par mots — chaque mot devient un span animable
  // indépendamment (révélation séquentielle).
  const titleWords = meta?.title.split(" ") ?? [];

  return (
    <aside
      className={`mg-anno${isOpen ? " is-open" : ""}`}
      role="dialog"
      aria-modal="false"
      aria-label="Matière sélectionnée"
      aria-hidden={!isOpen}
      inert={!isOpen}
      onClick={stop}
    >
      {meta ? (
        <>
          {/* Trait fin SVG : part du bord gauche de la zone et trace
              vers le marqueur. Dessiné via stroke-dashoffset au mount. */}
          <svg
            key={`line-${meta.slug}`}
            className="mg-anno__line"
            viewBox="0 0 100 1"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line x1="0" y1="0.5" x2="100" y2="0.5" />
          </svg>

          {/* Marqueur phosphor au bout de la ligne — point d'ancrage de
              l'annotation. Pop scale-in séquence après la ligne. */}
          <span
            key={`marker-${meta.slug}`}
            className="mg-anno__marker"
            aria-hidden="true"
          />

          {/* Corps de l'annotation — verticalement centré dans la zone droite. */}
          <div className="mg-anno__body">
            <span key={`code-${meta.slug}`} className="mg-anno__code">
              {meta.code} · {meta.domain}
            </span>

            <h2 className="mg-anno__title" aria-label={meta.title}>
              {titleWords.map((word, i) => (
                <span
                  key={`word-${meta.slug}-${i}`}
                  className="mg-anno__title-word"
                  style={{ ["--word-i" as string]: i } as React.CSSProperties}
                  aria-hidden="true"
                >
                  {word}
                  {i < titleWords.length - 1 ? " " : ""}
                </span>
              ))}
            </h2>

            <span
              key={`rule-${meta.slug}`}
              className="mg-anno__rule"
              aria-hidden="true"
            />

            <button
              key={`cta-${meta.slug}`}
              type="button"
              className="mg-anno__cta"
              onClick={handleCta}
            >
              <span className="mg-anno__cta-label">Entrer dans la matière</span>
              <span className="mg-anno__cta-arrow" aria-hidden="true">
                ›
              </span>
            </button>
          </div>

          <button
            type="button"
            className="mg-anno__close"
            onClick={onClose}
            aria-label="Fermer (Échap)"
          >
            [esc]
          </button>
        </>
      ) : null}
    </aside>
  );
}
