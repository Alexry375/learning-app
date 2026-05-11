"use client";

/**
 * <SearchPalette>
 *
 * Palette de recherche invocable au clavier (Ctrl+Alt+K) depuis la home
 * `/`. Permet de sélectionner une matière sans avoir à la trouver visuellement
 * dans le graphe 3D.
 *
 * Match fuzzy maison (pas de fuse.js — interdit) : multi-mot, chaque terme
 * doit être présent (en `includes` case-insensitive) dans la concat des
 * champs `code title domain` du node.
 *
 * Le shortcut est attaché sur `window` par le composant parent
 * (GraphSceneClient) pour ne pas être actif sur les routes plein écran.
 * La palette elle-même ne gère que les interactions internes
 * (filtrage, ↑↓, Enter, Esc, click).
 *
 * Quand l'utilisateur valide (Enter ou click sur item), `onSelect(slug)`
 * est appelé et la palette se ferme. Le parent route ce slug vers le même
 * flow que le click-bulle (fly + open panel).
 *
 * Styles dans `app/globals.css` (préfixe `.mg-palette__*`).
 */

import { useEffect, useMemo, useRef, useState } from "react";

export interface PaletteEntry {
  slug: string;
  code: string;
  title: string;
  domain: string;
}

interface SearchPaletteProps {
  isOpen: boolean;
  entries: PaletteEntry[];
  onSelect: (slug: string) => void;
  onClose: () => void;
}

/**
 * Filtre fuzzy maison : tokenize la query sur espaces, chaque token doit
 * matcher (substring case-insensitive) dans le champ concaténé.
 */
function filterEntries(entries: PaletteEntry[], query: string): PaletteEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  const tokens = q.split(/\s+/).filter(Boolean);
  return entries.filter((e) => {
    const hay = `${e.code} ${e.title} ${e.domain}`.toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
}

export function SearchPalette({
  isOpen,
  entries,
  onSelect,
  onClose,
}: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track de l'animation de fermeture pour décaler le unmount/reset query
  // (visuel : on veut que le contenu reste lisible pendant le 160ms ease-out).
  const [isClosing, setIsClosing] = useState(false);

  const filtered = useMemo(() => filterEntries(entries, query), [entries, query]);

  // Reset state à chaque ouverture (clean slate).
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIdx(0);
      setIsClosing(false);
      // Focus input à l'ouverture — léger délai pour laisser la transition
      // CSS commencer (sinon le focus peut sauter sur certains navs).
      const id = window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => window.cancelAnimationFrame(id);
    }
  }, [isOpen]);

  // Quand `filtered` change (typing), clamp `activeIdx` pour rester dans
  // la liste. Si la liste devient vide, activeIdx=0 reste safe (les
  // handlers Enter/↑↓ vérifient `filtered.length`).
  useEffect(() => {
    setActiveIdx((idx) => {
      if (filtered.length === 0) return 0;
      return Math.min(idx, filtered.length - 1);
    });
  }, [filtered]);

  // Keyboard handler local (Enter / ↑ / ↓ / Esc).
  // Note : on ne handle pas Ctrl+Alt+K ici — c'est le parent qui ouvre.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        triggerClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (filtered.length === 0) return;
        setActiveIdx((idx) => (idx + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (filtered.length === 0) return;
        setActiveIdx((idx) => (idx - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (filtered.length === 0) return;
        const pick = filtered[activeIdx] ?? filtered[0];
        if (pick) {
          onSelect(pick.slug);
          triggerClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // triggerClose is stable (defined in this scope, captures setIsClosing + onClose)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filtered, activeIdx, onSelect]);

  function triggerClose() {
    // Lance l'anim de fermeture, puis remonte au parent quand l'anim est
    // finie (sinon le DOM se démonte avant que la transition CSS ait pu
    // jouer). 160ms = la durée de la transition `.is-closing`.
    setIsClosing(true);
    window.setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 160);
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Stop le bubble pour ne pas atteindre le wrapper Canvas (qui fermerait
    // le panneau matière si ouvert dessous). On ne veut fermer QUE la
    // palette. (Fix audit C1.)
    e.stopPropagation();
    triggerClose();
  };

  // Même logique : un click *dans* la palette (input, items) ne doit pas
  // remonter au wrapper Canvas.
  const stopBubble = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Cls calculées pour le backdrop + container : `is-open` pendant l'état
  // ouvert, `is-closing` pendant le slide-out.
  const visible = isOpen || isClosing;
  if (!visible) return null;

  const containerCls = [
    "mg-palette",
    isOpen && !isClosing ? "is-open" : "",
    isClosing ? "is-closing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const backdropCls = [
    "mg-palette-backdrop",
    isOpen && !isClosing ? "is-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className={backdropCls} onClick={handleBackdropClick} />
      <div
        className={containerCls}
        role="dialog"
        aria-label="Recherche"
        aria-hidden={!isOpen || isClosing}
        // inert quand fermé : focus tab ne peut pas atteindre l'input
        // resté dans le DOM pendant les 160ms de slide-out.
        inert={!isOpen || isClosing}
        onClick={stopBubble}
      >
        <input
          ref={inputRef}
          className="mg-palette__input"
          type="text"
          placeholder="rechercher une anomalie…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Recherche d'anomalie"
        />
        <div className="mg-palette__results" role="listbox">
          {filtered.length === 0 ? (
            <div className="mg-palette__empty">aucun résultat</div>
          ) : (
            filtered.map((entry, idx) => (
              <div
                key={entry.slug}
                className={`mg-palette__item${idx === activeIdx ? " is-active" : ""}`}
                role="option"
                aria-selected={idx === activeIdx}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => {
                  onSelect(entry.slug);
                  triggerClose();
                }}
              >
                <span className="mg-palette__item-code">{entry.code}</span>
                <span className="mg-palette__item-title">{entry.title}</span>
                <span className="mg-palette__item-domain">{entry.domain}</span>
              </div>
            ))
          )}
        </div>
        <div className="mg-palette__footer">
          ↑↓ naviguer · ↵ ouvrir · esc fermer
        </div>
      </div>
    </>
  );
}
