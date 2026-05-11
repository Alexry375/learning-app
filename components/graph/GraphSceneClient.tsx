"use client";

/**
 * <GraphSceneClient>
 *
 * Graphe 3D force-directed des anomalies. Chaque node = une matière, rendu en
 * <Bubble> wobble-transmission via `nodeThreeObject` de r3f-forcegraph.
 *
 * Le force-graph est délégué à r3f-forcegraph (wrapper R3F de
 * three-forcegraph / d3-force-3d, par vasturiano). Trois grosses tâches qu'il
 * gère pour nous : layout 3D continu, dragging des nodes, hover/click events.
 *
 * Le rendu des nodes (la bulle elle-même) reste sous notre contrôle total via
 * `createBubbleMesh` du module bubble/.
 *
 * --- Mario Galaxy split-screen ---
 *
 * Click sur une bulle (ou sélection palette) :
 *   1) snapshot caméra (`originPoseRef`) pour le fly-back ;
 *   2) fly-to ~1s easeInOutCubic qui amène la bulle en *screen-left* (offset
 *      sur l'axe `right` caméra → la bulle finit à ~25-30% from left) ;
 *   3) OrbitControls désactivés pendant l'anim ;
 *   4) à la fin de l'anim → ouverture du <MatierePanel> (slide-in droite).
 *      Plus de router.push automatique. Le CTA "Entrer dans la matière"
 *      navigue explicitement.
 *
 * Fermeture (Esc / click outside / × du panneau) :
 *   - slide-out du panneau (320ms) ;
 *   - à mi-chemin, fly-back caméra (~0.8s) vers `originPoseRef` ;
 *   - ré-active OrbitControls.
 *
 * Swap matière sans fermer (autre bulle pendant panneau ouvert) :
 *   - on enchaîne fly-to + le panneau cross-fade son contenu.
 *   - on ne reset PAS `originPoseRef` (la pose de retour reste la pose
 *     d'origine — pas celle de la matière qu'on quitte). Cohérent avec
 *     le pattern *master-detail*.
 *
 * Palette de recherche : Ctrl+Alt+K → SearchPalette, sélection déclenche
 * le même flow que le click-bulle.
 */

import * as React from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import R3fForceGraphBase from "r3f-forcegraph";

// r3f-forcegraph hérite de props (nodeLabel, enableNodeDrag, …) que ses
// types .d.ts n'exposent pas. On élargit localement le composant sans
// changer son comportement runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const R3fForceGraph = R3fForceGraphBase as unknown as React.FC<any>;
import {
  createBubbleMesh,
  updateBubbleMaterial,
  colorFromSlug,
  type BubbleMaterial,
} from "@/components/bubble/bubble-material";
// <Backdrop> retiré du graphe (sphère mal dimensionnée visible au centre
// quand la caméra est à l'extérieur). Toujours utilisé par le proto
// standalone <BubbleSceneClient>.
import { ProceduralEnvironment } from "@/components/bubble/ProceduralEnvironment";
import { ANOMALIES } from "@/anomalies/registry";
import { MatierePanel } from "./MatierePanel";
import { SearchPalette, type PaletteEntry } from "./SearchPalette";

type GraphNode = {
  id: string;
  label: string;
  domain?: string;
  placeholder?: boolean;
  // r3f-forcegraph injecte x/y/z à chaque tick (positions simulées)
  x?: number;
  y?: number;
  z?: number;
};
type GraphLink = { source: string; target: string };
type GraphData = { nodes: GraphNode[]; links: GraphLink[] };

const BUBBLE_RADIUS = 14;
const FLY_DURATION_S = 1.0;
const FLY_DISTANCE_FACTOR = 3; // caméra à 3× radius de la bulle (initial — non utilisé après l'itération [23:38])
// NDC x cible pour la bulle après le fly-in. -0.62 = ~19% du bord gauche
// (centre = 0, bord gauche = -1). Le panneau matière occupe ~40% à droite
// (clamp 420-580px sur largeur typique), donc la zone visible utile va de
// NDC ≈ -1 à ≈ +0.2. Cibler -0.62 colle la bulle franchement à gauche,
// avec encore une marge propre vs bord (-1) pour ne pas la coller.
// (Itération [23:38] Alexis : "que les bulles prennent encore un peu plus
// de place sur la partie gauche".)
const TARGET_NDC_X = -0.62;
// Distance caméra → bulle, exprimée en multiples de BUBBLE_RADIUS. Plus
// petit = plus zoomé. 2.6 (vs 3.0 initial) zoome ~15% sur la bulle après
// le fly-in pour qu'elle prenne plus de place sur la moitié gauche.
const FLY_DISTANCE_FACTOR_TARGET = 2.6;
// Fallback offset si on n'a pas accès au viewport au moment du fly (très
// improbable : `useThree` rend `size` toujours défini). Cale-toi sur l'ancienne
// constante pour ne pas casser de manière subtile.
const FALLBACK_SCREEN_LEFT_OFFSET = 1.4 * BUBBLE_RADIUS;
// Durée du fly-back (retour vers la pose pré-fly-in). Légèrement plus court
// que le fly-in pour donner du rythme à la fermeture.
const FLY_BACK_DURATION_S = 0.8;
// Délai à mi-chemin du slide-out panneau avant de lancer le fly-back.
// Slide-out = 320ms ; on lance le fly-back à 160ms.
const FLY_BACK_DELAY_MS = 160;
// Pose initiale du Canvas — utilisée comme fallback de fly-back si on
// n'a aucun snapshot (deep-link, edge case).
const INITIAL_CAM_POS = new THREE.Vector3(0, 0, 220);
const INITIAL_LOOKAT = new THREE.Vector3(0, 0, 0);

/** easeInOutCubic — t ∈ [0, 1] */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Snapshot de cible cinématique — utilisé pour les deux directions
 * (fly-in vers une bulle, fly-back vers l'origine).
 */
type FlyTarget = {
  kind: "to-bubble" | "to-origin";
  /** slug ciblé (uniquement pour `to-bubble`, sert au callback de fin). */
  slug: string | null;
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromLookAt: THREE.Vector3;
  toLookAt: THREE.Vector3;
  duration: number;
  startTime: number; // initialisé au premier frame d'anim
};

function buildGraphData(): GraphData {
  const nodes: GraphNode[] = ANOMALIES.map((a) => ({
    id: a.slug,
    label: a.title,
    domain: a.domain,
  }));

  // Placeholders pour densifier le graphe tant qu'il y a peu d'anomalies.
  nodes.push({ id: "future-2", label: "À venir", placeholder: true });
  nodes.push({ id: "future-3", label: "À venir", placeholder: true });

  // Pas de links : la sémantique "lien entre matières" est creuse à ce stade,
  // et leur rendu produisait un cercle visible reliant les bulles. Le layout
  // tient sur la répulsion mutuelle des nodes (forces de d3-force-3d).
  return { nodes, links: [] };
}

function GraphContent({
  graphData,
  onNodeHover,
  onNodeClick,
  flyRef,
  onFlyComplete,
  orbitTargetRef,
  sizeRef,
  isPaused,
  openedSlugRef,
}: {
  graphData: GraphData;
  onNodeHover: (node: GraphNode | null) => void;
  onNodeClick: (node: GraphNode) => void;
  flyRef: React.MutableRefObject<FlyTarget | null>;
  onFlyComplete: (target: FlyTarget) => void;
  orbitTargetRef: React.MutableRefObject<THREE.Vector3>;
  /** Dim courantes du Canvas (R3F `size`). Mises à jour à chaque resize. */
  sizeRef: React.MutableRefObject<{ width: number; height: number }>;
  /** True quand on ne veut pas que le drag node soit autorisé (fly, panel ouvert). */
  isPaused: boolean;
  /** Slug de la bulle sélectionnée (lu dans useFrame pour la rotation locale). */
  openedSlugRef: React.MutableRefObject<string | null>;
}) {
  // any-typed ref — r3f-forcegraph's TS types don't expose tickFrame() cleanly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<BubbleMaterial[]>([]);
  // Map slug → mesh, peuplée dans nodeThreeObject. Sert à faire tourner la
  // bulle sélectionnée sur elle-même quand le panneau est ouvert.
  const meshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const flyEndFiredRef = useRef<FlyTarget | null>(null);

  // Tient sizeRef.current à jour ; lu par flyToBubble (composant parent) au
  // moment du fly. Pas besoin de re-render — c'est juste un canal de
  // synchronisation. R3F garantit que `size` change au resize.
  useEffect(() => {
    sizeRef.current.width = size.width;
    sizeRef.current.height = size.height;
  }, [size.width, size.height, sizeRef]);

  // Tune les forces d3 après le mount : on veut une répulsion plus forte pour
  // que les bulles ne se chevauchent pas (sans links pour les rapprocher, la
  // charge par défaut n'écarte pas assez à BUBBLE_RADIUS=14).
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const charge = fg.d3Force?.("charge");
    charge?.strength?.(-180);
  }, []);

  const nodeThreeObject = useCallback((node: object) => {
    const n = node as GraphNode;
    const color = n.placeholder ? "#2a2f3d" : colorFromSlug(n.id);
    const mesh = createBubbleMesh({
      color,
      radius: BUBBLE_RADIUS,
      segments: 96,
      wobbleAmp: n.placeholder ? 0.03 : 0.1,
      wobbleFreq: 1.8,
      // Adoucissement iridescence / env reflets — réduit le banding rasant
      // (cf. Tâche D.2). Le proto standalone garde les defaults.
      iridescenceAmp: 0.6,
      envMapIntensityScale: 0.7,
    });
    const mat = (mesh as THREE.Mesh & { bubbleMaterial: BubbleMaterial })
      .bubbleMaterial;
    materialsRef.current.push(mat);
    meshMapRef.current.set(n.id, mesh);
    return mesh;
  }, []);

  useFrame((state, dt) => {
    // Pause de la simulation force-graph quand le panneau est ouvert ou
    // qu'un fly est en cours. Garde la bulle cible figée à la position
    // capturée au click (sinon elle continuait sa trajectoire d3 et sortait
    // du cadre cinématique). Le wobble surface des bulles continue plus bas
    // — c'est de la déformation shader, pas du déplacement.
    if (!isPaused) {
      fgRef.current?.tickFrame();
    }
    const t = state.clock.elapsedTime;
    for (const mat of materialsRef.current) {
      updateBubbleMaterial(mat, dt, t);
    }

    // Gravitation : rotation très lente de l'ensemble du graphe autour de
    // l'axe Y — ~1 tour toutes les 90s. OFF pendant fly + panel ouvert
    // (même raisons que la pause force-graph ci-dessus).
    if (groupRef.current && !isPaused) {
      groupRef.current.rotation.y += dt * 0.07;
    }

    // Rotation locale de la bulle sélectionnée — la sphère "vient à toi" et
    // tourne sur elle-même pendant que le panneau est ouvert. ~1 tour / 10s.
    // Pas pendant le fly-in (openedSlug est encore null à ce moment) — la
    // rotation locale commence proprement à l'ouverture du panneau.
    const openedSlug = openedSlugRef.current;
    if (openedSlug !== null) {
      const selectedMesh = meshMapRef.current.get(openedSlug);
      if (selectedMesh) {
        selectedMesh.rotation.y += dt * 0.6;
      }
    }

    // === Camera fly (to-bubble ou to-origin) ===
    const fly = flyRef.current;
    if (fly) {
      if (fly.startTime < 0) {
        fly.startTime = t;
      }
      const elapsed = t - fly.startTime;
      const raw = Math.min(elapsed / fly.duration, 1);
      const k = easeInOutCubic(raw);

      camera.position.lerpVectors(fly.fromPos, fly.toPos, k);
      const currentLook = new THREE.Vector3().lerpVectors(
        fly.fromLookAt,
        fly.toLookAt,
        k,
      );
      camera.lookAt(currentLook);
      // Mémorise le lookAt courant pour qu'un prochain fly capture le bon
      // `fromLookAt`. Lu aussi par OrbitControls quand on lui rend la main.
      orbitTargetRef.current.copy(currentLook);

      if (raw >= 1 && flyEndFiredRef.current !== fly) {
        // Fire-once guard par identité de l'objet (un même target ne fire
        // qu'une fois ; un swap → nouveau target → re-fire).
        flyEndFiredRef.current = fly;
        onFlyComplete(fly);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <R3fForceGraph
        ref={fgRef}
        graphData={graphData}
        nodeThreeObject={nodeThreeObject}
        nodeRelSize={BUBBLE_RADIUS}
        nodeLabel="label"
        nodeOpacity={1}
        // Pas de links visibles — sémantique pas encore définie. Le layout
        // tient par la répulsion mutuelle (charge ajustée plus haut).
        linkVisibility={false}
        enableNodeDrag={!isPaused}
        onNodeHover={(node: object | null) =>
          onNodeHover((node as GraphNode | null) ?? null)
        }
        onNodeClick={(node: object) => onNodeClick(node as GraphNode)}
      />
    </group>
  );
}

export default function GraphSceneClient() {
  const router = useRouter();
  const graphData = useMemo(buildGraphData, []);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  // True pendant un fly (in ou back) — désactive OrbitControls + drag node.
  const [isFlying, setIsFlying] = useState(false);
  // Slug de la matière ouverte (panneau visible). null = panneau fermé.
  const [openedSlug, setOpenedSlug] = useState<string | null>(null);
  // True pendant le slide-out (avant que `openedSlug` ne soit reset à null).
  const [isPanelClosing, setIsPanelClosing] = useState(false);
  // Palette de recherche
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Ref source de vérité pour l'anim (lue à chaque frame, n'a pas besoin de re-render)
  const flyRef = useRef<FlyTarget | null>(null);
  // Cible courante d'OrbitControls (mutée pendant le fly pour rester cohérent).
  const orbitTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  // Ref de la caméra exposée par le Canvas (peuplée via onCreated).
  const cameraRef = useRef<THREE.Camera | null>(null);
  // Taille courante du Canvas (mise à jour par <GraphContent> via useThree(size)).
  // Lu au moment du fly pour recalculer l'offset latéral. Init à viewport
  // window pour qu'un fly très précoce avant montage du Canvas ait quand
  // même une valeur raisonnable (le wrapper fixed inset:0 → Canvas = window).
  const sizeRef = useRef<{ width: number; height: number }>({
    width: typeof window !== "undefined" ? window.innerWidth : 1440,
    height: typeof window !== "undefined" ? window.innerHeight : 900,
  });
  // Snapshot de la pose pré-fly-in. Capturé au premier fly-to-bubble depuis
  // l'état "panneau fermé". NE PAS écraser lors d'un swap matière (master-detail).
  const originPoseRef = useRef<{
    pos: THREE.Vector3;
    look: THREE.Vector3;
  } | null>(null);
  // Timer de fly-back (mi-chemin slide-out). Annulable si l'utilisateur
  // re-clique avant la fin.
  const flyBackTimerRef = useRef<number | null>(null);
  // Timer de fin de slide-out (320ms). Annulable au démontage.
  const closeFinishTimerRef = useRef<number | null>(null);
  // Ref miroir d'openedSlug — lu dans useFrame (sans re-render) pour piloter
  // la rotation locale de la bulle sélectionnée.
  const openedSlugRef = useRef<string | null>(null);

  /**
   * Calcule la cible de fly-in pour amener la bulle en screen-left.
   * - direction = (camera → node) normalisée.
   * - position cible = node + dir * 3*R (recule la caméra à 3R) + right * offset
   *   (décale la caméra latéralement → la bulle apparaît à gauche de l'écran).
   * - lookAt = centre de la bulle.
   *
   * `screenLeftOffset` est calculé dynamiquement par le caller à partir du
   * fov caméra + aspect ratio viewport (cf. `flyToBubble`). Cela garantit
   * que la bulle finit à NDC x = TARGET_NDC_X quel que soit le viewport.
   */
  const computeFlyToBubble = useCallback(
    (
      nodePos: THREE.Vector3,
      camera: THREE.Camera,
      screenLeftOffset: number,
    ): { toPos: THREE.Vector3; toLookAt: THREE.Vector3 } => {
      // Direction depuis la bulle vers la caméra actuelle (garde l'angle de
      // vue, on se rapproche juste).
      const dir = new THREE.Vector3().subVectors(camera.position, nodePos);
      if (dir.lengthSq() < 1e-6) {
        dir.set(0, 0, 1);
      }
      dir.normalize();

      // Axe `right` caméra = cross(up, -dir) ≈ cross(up, dirFromCamToNode).
      // On veut l'axe horizontal de la caméra ; selon l'orientation cam.up,
      // on prend cross(up, dir) (où dir va de node vers cam). Pour pousser
      // la bulle visuellement à gauche de l'écran, il faut décaler la
      // caméra vers la *droite* du repère caméra. `right` = cross(up, dir).
      // Note: on utilise cross(camera.up, dir) — on garde camera.up tel quel
      // (typiquement Y+).
      const right = new THREE.Vector3()
        .crossVectors(camera.up, dir)
        .normalize();
      // Si `right` est dégénéré (cam pile sur l'axe Y), fallback X+.
      if (right.lengthSq() < 1e-6) {
        right.set(1, 0, 0);
      }

      const toPos = new THREE.Vector3()
        .copy(nodePos)
        .addScaledVector(dir, BUBBLE_RADIUS * FLY_DISTANCE_FACTOR_TARGET)
        .addScaledVector(right, screenLeftOffset);

      // lookAt = centre bulle (pas l'origine, sinon la bulle n'apparaît pas
      // centrée sur la moitié gauche).
      const toLookAt = nodePos.clone();
      return { toPos, toLookAt };
    },
    [],
  );

  /**
   * Calcule l'offset world-space sur l'axe `right` caméra nécessaire pour
   * placer la bulle à NDC x = TARGET_NDC_X après le fly-in.
   *
   * Géométrie : à distance `camDistance` de la cible, le demi-champ visible
   * horizontalement (en world units) vaut
   *   halfW = camDistance · tan(halfFovH)
   * où halfFovH = atan(tan(halfFovV) · aspect).
   *
   * Pour amener la bulle à NDC x = -k (k>0), il faut décaler la caméra de
   * `+k · halfW` sur l'axe `right` (la bulle apparaît alors à -k · halfW
   * dans l'espace caméra). On retourne donc |k| · halfW.
   *
   * Recalculé à chaque fly-to (pas mis en cache) pour rester robuste au
   * resize de la fenêtre entre deux flys.
   */
  const computeScreenLeftOffset = useCallback(
    (
      camera: THREE.Camera,
      viewportWidth: number,
      viewportHeight: number,
    ): number => {
      const camDistance = BUBBLE_RADIUS * FLY_DISTANCE_FACTOR_TARGET;
      // Récupère le fov vertical en degrés depuis la PerspectiveCamera.
      // Fallback à 38° (valeur du Canvas) si la caméra n'a pas de fov.
      const persp = camera as THREE.PerspectiveCamera;
      const fovV = typeof persp.fov === "number" && persp.fov > 0 ? persp.fov : 38;
      const halfFovV = (fovV * Math.PI) / 180 / 2;
      // Aspect ratio courant — peut changer au resize. Garde contre /0
      // au cas où le size initial est 0 (1er frame avant layout).
      const safeHeight = viewportHeight > 0 ? viewportHeight : 1;
      const safeWidth = viewportWidth > 0 ? viewportWidth : safeHeight;
      const aspect = safeWidth / safeHeight;
      const halfFovH = Math.atan(Math.tan(halfFovV) * aspect);
      const halfWidthWorld = camDistance * Math.tan(halfFovH);
      // Cap mou : si halfWidthWorld dégénère (NaN, négatif), fallback.
      if (!Number.isFinite(halfWidthWorld) || halfWidthWorld <= 0) {
        return FALLBACK_SCREEN_LEFT_OFFSET;
      }
      return Math.abs(TARGET_NDC_X) * halfWidthWorld;
    },
    [],
  );

  /**
   * Lance un fly-to-bubble vers le node `slug`. Capture le snapshot pré-fly-in
   * si on n'en a pas déjà un (premier fly depuis état fermé).
   */
  const flyToBubble = useCallback(
    (node: GraphNode) => {
      const camera = cameraRef.current;
      if (!camera) return;

      const nx = node.x ?? 0;
      const ny = node.y ?? 0;
      const nz = node.z ?? 0;
      const nodePos = new THREE.Vector3(nx, ny, nz);

      // Snapshot pré-fly-in *si* c'est le premier fly depuis l'état fermé.
      // Lors d'un swap matière (panel ouvert), on garde la pose d'origine.
      if (originPoseRef.current === null) {
        originPoseRef.current = {
          pos: camera.position.clone(),
          look: orbitTargetRef.current.clone(),
        };
      }

      // Recalcule l'offset latéral au moment du fly (robuste au resize).
      const screenLeftOffset = computeScreenLeftOffset(
        camera,
        sizeRef.current.width,
        sizeRef.current.height,
      );
      const { toPos, toLookAt } = computeFlyToBubble(
        nodePos,
        camera,
        screenLeftOffset,
      );

      flyRef.current = {
        kind: "to-bubble",
        slug: node.id,
        fromPos: camera.position.clone(),
        toPos,
        fromLookAt: orbitTargetRef.current.clone(),
        toLookAt,
        duration: FLY_DURATION_S,
        startTime: -1,
      };
      setIsFlying(true);
    },
    [computeFlyToBubble, computeScreenLeftOffset],
  );

  /**
   * Lance un fly-back vers la pose d'origine (snapshot pré-fly-in). Si pas
   * de snapshot (cas improbable mais possible si on est entré par deep-link
   * et qu'on a navigué autrement), fallback sur la pose initiale.
   */
  const flyBack = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    const target = originPoseRef.current ?? {
      pos: INITIAL_CAM_POS.clone(),
      look: INITIAL_LOOKAT.clone(),
    };

    flyRef.current = {
      kind: "to-origin",
      slug: null,
      fromPos: camera.position.clone(),
      toPos: target.pos.clone(),
      fromLookAt: orbitTargetRef.current.clone(),
      toLookAt: target.look.clone(),
      duration: FLY_BACK_DURATION_S,
      startTime: -1,
    };
    setIsFlying(true);
  }, []);

  /**
   * Click sur une bulle :
   *  - si placeholder → ignore.
   *  - si on est déjà en plein fly → ignore.
   *  - si panneau ouvert et même slug → ignore (rien à faire).
   *  - sinon : fly-to (+ snapshot si fermé) ; à la fin du fly, le callback
   *    `handleFlyComplete` ouvrira le panneau (ou swap son contenu).
   */
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.placeholder) return;
      if (flyRef.current !== null) return;
      if (openedSlug === node.id && !isPanelClosing) {
        // Déjà ouvert sur cette matière — pas de re-fly inutile.
        return;
      }

      // Cas swap : panneau ouvert, autre matière. On met à jour `openedSlug`
      // *immédiatement* pour que le panneau cross-fade le contenu, et on
      // enchaîne le fly. (Spec : "on ne ferme pas le panneau".)
      if (openedSlug !== null && openedSlug !== node.id) {
        setOpenedSlug(node.id);
      }
      // Annule un fly-back ET le reset différé en cours (au cas où on a
      // re-cliqué pendant que le panneau était en train de se fermer).
      // Sans le second clear, le timer de 320ms reset `openedSlug=null`
      // *après* notre setOpenedSlug → on perdrait le swap.
      if (flyBackTimerRef.current !== null) {
        window.clearTimeout(flyBackTimerRef.current);
        flyBackTimerRef.current = null;
      }
      if (closeFinishTimerRef.current !== null) {
        window.clearTimeout(closeFinishTimerRef.current);
        closeFinishTimerRef.current = null;
      }
      if (isPanelClosing) {
        setIsPanelClosing(false);
      }
      flyToBubble(node);
    },
    [openedSlug, isPanelClosing, flyToBubble],
  );

  /**
   * Callback fin de fly. Si c'était un fly-to-bubble, ouvre le panneau.
   * Si c'était un fly-back, reset le snapshot d'origine.
   */
  const handleFlyComplete = useCallback((target: FlyTarget) => {
    // Reset flyRef + isFlying.
    flyRef.current = null;
    setIsFlying(false);

    if (target.kind === "to-bubble" && target.slug) {
      setOpenedSlug(target.slug);
    } else if (target.kind === "to-origin") {
      // Fly-back terminé : on est revenu à la pose pré-fly-in. On invalide
      // le snapshot pour qu'une prochaine ouverture re-capture la pose
      // courante (qui peut être différente si l'utilisateur a draggé entre
      // temps — mais ici on vient juste de finir le fly, donc identique).
      originPoseRef.current = null;
    }
  }, []);

  /**
   * Demande de fermeture du panneau (Esc, click outside, ×).
   * - slide-out 320ms ;
   * - à mi-chemin (FLY_BACK_DELAY_MS) → flyBack ;
   * - à la fin du fly-back → handleFlyComplete reset le snapshot.
   */
  const handleClose = useCallback(() => {
    if (openedSlug === null) return;
    if (isPanelClosing) return; // déjà en train de fermer
    setIsPanelClosing(true);
    // À mi-chemin du slide-out (160ms / 320ms), démarre le fly-back.
    flyBackTimerRef.current = window.setTimeout(() => {
      flyBackTimerRef.current = null;
      flyBack();
    }, FLY_BACK_DELAY_MS);
    // À la fin du slide-out (320ms), reset openedSlug + isPanelClosing.
    // Le fly-back lui continue son anim derrière. Timer ref pour cleanup
    // si l'utilisateur démonte la page entre temps.
    closeFinishTimerRef.current = window.setTimeout(() => {
      closeFinishTimerRef.current = null;
      setOpenedSlug(null);
      setIsPanelClosing(false);
    }, 320);
  }, [openedSlug, isPanelClosing, flyBack]);

  /**
   * Click sur le wrapper (zone non-panneau, non-bulle) :
   *   - si panneau ouvert → fermeture.
   *   - sinon → no-op (OrbitControls a déjà géré le drag).
   *
   * Le panneau lui-même `stopPropagation` sur ses click internes pour ne pas
   * remonter ici. Les click-bulles passent par `onNodeClick` du forcegraph
   * et n'atteignent pas non plus ce handler (events R3F vs DOM).
   */
  const handleWrapperClick = useCallback(() => {
    if (openedSlug !== null && !isPanelClosing) {
      handleClose();
    }
  }, [openedSlug, isPanelClosing, handleClose]);

  /**
   * Shortcut Ctrl+Alt+K → ouvre la palette. Listener global pour que la
   * palette s'ouvre même si un input ailleurs avait le focus.
   *
   * Note Tâche B : la palette n'est pas accessible depuis `/anomalie/<slug>`
   * car ce composant n'est monté que sur `/`.
   */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Cleanup timers au démontage
  useEffect(() => {
    return () => {
      if (flyBackTimerRef.current !== null) {
        window.clearTimeout(flyBackTimerRef.current);
      }
      if (closeFinishTimerRef.current !== null) {
        window.clearTimeout(closeFinishTimerRef.current);
      }
    };
  }, []);

  // Sync openedSlugRef ← openedSlug. Permet à useFrame (dans GraphContent)
  // de lire la valeur courante sans re-render à chaque frame.
  useEffect(() => {
    openedSlugRef.current = openedSlug;
  }, [openedSlug]);

  // Entrées palette (placeholders exclus + tri par order via registry).
  const paletteEntries = useMemo<PaletteEntry[]>(
    () =>
      ANOMALIES.map((a) => ({
        slug: a.slug,
        code: a.code,
        title: a.title,
        domain: a.domain,
      })),
    [],
  );

  const handlePaletteSelect = useCallback(
    (slug: string) => {
      // Reconstruit un GraphNode-like ; on trouve les positions courantes
      // dans graphData.nodes (mises à jour par r3f-forcegraph en place).
      const node = graphData.nodes.find((n) => n.id === slug);
      if (!node) return;
      handleNodeClick(node);
    },
    [graphData, handleNodeClick],
  );

  // Le canvas reste pleinement interactif tant que le panneau est fermé.
  // OrbitControls est désactivé pendant le fly (in ou back) ET tant que le
  // panneau est ouvert (lecture du briefing, pas de manip 3D).
  const orbitEnabled = !isFlying && openedSlug === null;
  // True quand on ne veut pas que le drag node soit autorisé.
  const isPaused = isFlying || openedSlug !== null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#050609",
        cursor:
          hoveredNode && !hoveredNode.placeholder && !isFlying
            ? "pointer"
            : isFlying
              ? "wait"
              : "grab",
      }}
      onClick={handleWrapperClick}
    >
      <Canvas
        camera={{ position: [0, 0, 220], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, toneMappingExposure: 0.9 }}
        onCreated={({ camera }) => {
          cameraRef.current = camera;
        }}
      >
        {/* <Backdrop /> retiré : la sphère radius=30 BackSide était mal
            dimensionnée pour ce contexte (caméra à z=220, donc à l'extérieur
            de la sphère → la backdrop apparaissait comme un petit objet
            central par réfraction des bulles transmission). La
            ProceduralEnvironment ci-dessous donne suffisamment de contenu
            à réfracter. (Tâche D.1) */}
        <ProceduralEnvironment />

        <ambientLight intensity={0.4} color="#202840" />
        {/* Intensités réduites (Tâche D.2) — adoucit les bords de bulles
            cramés à incidence rasante sur GPU réel. */}
        <pointLight
          position={[60, 30, 30]}
          intensity={160}
          decay={1.5}
          distance={600}
          color="#66c8ff"
        />
        <pointLight
          position={[-50, 20, -20]}
          intensity={130}
          decay={1.5}
          distance={600}
          color="#ff66c8"
        />
        <pointLight
          position={[20, -40, 10]}
          intensity={100}
          decay={1.5}
          distance={600}
          color="#ffaa66"
        />

        <GraphContent
          graphData={graphData}
          onNodeHover={setHoveredNode}
          onNodeClick={handleNodeClick}
          flyRef={flyRef}
          onFlyComplete={handleFlyComplete}
          orbitTargetRef={orbitTargetRef}
          sizeRef={sizeRef}
          isPaused={isPaused}
          openedSlugRef={openedSlugRef}
        />

        <OrbitControls
          enabled={orbitEnabled}
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          minDistance={40}
          maxDistance={500}
        />

        <EffectComposer>
          <Bloom
            intensity={0.4}
            luminanceThreshold={0.78}
            luminanceSmoothing={0.4}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      {/* HUD top-right caché quand le panneau matière est ouvert (sinon il
          overlapait avec [esc] [×] du panel). On garde aussi la fade-out
          pendant le slide-in pour ne pas avoir un saut sec. */}
      <div
        style={{
          position: "fixed",
          top: 24,
          right: 32,
          fontFamily: "ui-monospace, monospace",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(180, 195, 215, 0.55)",
          textAlign: "right",
          pointerEvents: "none",
          opacity: openedSlug !== null ? 0 : 1,
          transition: "opacity 240ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ color: "rgba(120, 170, 255, 0.9)", marginBottom: 4 }}>
          graphe
        </div>
        <div style={{ color: "rgba(220, 230, 245, 0.85)" }}>
          {ANOMALIES.length} anomalie{ANOMALIES.length > 1 ? "s" : ""} · r3f-forcegraph
        </div>
      </div>

      {hoveredNode && !hoveredNode.placeholder && !isFlying && openedSlug === null && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 32,
            maxWidth: 360,
            padding: "16px 20px",
            background: "rgba(8, 11, 20, 0.78)",
            border: "1px solid rgba(120, 170, 255, 0.35)",
            borderRadius: 4,
            fontFamily: "ui-monospace, monospace",
            color: "rgba(220, 230, 245, 0.9)",
            backdropFilter: "blur(6px)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(120, 170, 255, 0.9)",
              marginBottom: 6,
            }}
          >
            {hoveredNode.domain ?? "anomalie"}
          </div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>
            {hoveredNode.label}
          </div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(180, 195, 215, 0.5)",
            }}
          >
            click pour ouvrir
          </div>
        </div>
      )}

      {/* Hint clavier bottom-left — caché quand le panneau matière est ouvert
          (la bulle sélectionnée occupe la zone gauche, le hint devenait du
          bruit visuel). */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          left: 32,
          fontFamily: "ui-monospace, monospace",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(180, 195, 215, 0.4)",
          pointerEvents: "none",
          opacity: openedSlug !== null ? 0 : 1,
          transition: "opacity 240ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        drag · scroll · click bulle · ctrl+alt+k rechercher
      </div>

      {/* Panneau Mario Galaxy */}
      <MatierePanel
        slug={openedSlug}
        isOpen={openedSlug !== null && !isPanelClosing}
        onClose={handleClose}
      />

      {/* Palette de recherche */}
      <SearchPalette
        isOpen={paletteOpen}
        entries={paletteEntries}
        onSelect={(slug) => {
          handlePaletteSelect(slug);
        }}
        onClose={() => setPaletteOpen(false)}
      />
    </div>
  );
}
