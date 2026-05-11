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
 * Comportement click :
 *   1) snapshot de la position courante de la caméra et de la bulle cible ;
 *   2) anim de ~1s easeInOutCubic vers (bullePos + dir * 3*radius) ;
 *   3) OrbitControls désactivés pendant l'anim, clicks ignorés ;
 *   4) à la fin de l'anim, router.push('/anomalie/<slug>') — la transition est
 *      atomique avec la fin du fly (pas de saut visible).
 */

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Backdrop } from "@/components/bubble/Backdrop";
import { ProceduralEnvironment } from "@/components/bubble/ProceduralEnvironment";
import { ANOMALIES } from "@/anomalies/registry";

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
const FLY_DISTANCE_FACTOR = 3; // caméra à 3× radius de la bulle

/** easeInOutCubic — t ∈ [0, 1] */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Snapshot des positions cibles capturé au moment du click.
 * Plus simple et plus cinématique que suivre un node qui bouge.
 */
type FlySnapshot = {
  slug: string;
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromLookAt: THREE.Vector3;
  toLookAt: THREE.Vector3;
  startTime: number; // sera initialisé au premier frame d'anim
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
  isFlying,
}: {
  graphData: GraphData;
  onNodeHover: (node: GraphNode | null) => void;
  onNodeClick: (node: GraphNode) => void;
  flyRef: React.MutableRefObject<FlySnapshot | null>;
  onFlyComplete: (slug: string) => void;
  orbitTargetRef: React.MutableRefObject<THREE.Vector3>;
  isFlying: boolean;
}) {
  // any-typed ref — r3f-forcegraph's TS types don't expose tickFrame() cleanly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<BubbleMaterial[]>([]);
  const camera = useThree((s) => s.camera);
  const flyEndFiredRef = useRef<string | null>(null);

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
    });
    const mat = (mesh as THREE.Mesh & { bubbleMaterial: BubbleMaterial })
      .bubbleMaterial;
    materialsRef.current.push(mat);
    return mesh;
  }, []);

  useFrame((state, dt) => {
    fgRef.current?.tickFrame();
    const t = state.clock.elapsedTime;
    for (const mat of materialsRef.current) {
      updateBubbleMaterial(mat, dt, t);
    }

    // Gravitation : rotation très lente de l'ensemble du graphe autour de
    // l'axe Y — ~1 tour toutes les 90s. Pausé pendant le fly pour éviter
    // qu'une bulle qui s'éloigne perturbe la cible cinématique.
    if (groupRef.current && !flyRef.current) {
      groupRef.current.rotation.y += dt * 0.07;
    }

    // === Camera fly-to (snapshot at click time) ===
    const fly = flyRef.current;
    if (fly) {
      // initialise startTime au tout premier frame du fly
      if (fly.startTime < 0) {
        fly.startTime = t;
      }
      const elapsed = t - fly.startTime;
      const raw = Math.min(elapsed / FLY_DURATION_S, 1);
      const k = easeInOutCubic(raw);

      // Interpolation position + lookAt
      camera.position.lerpVectors(fly.fromPos, fly.toPos, k);
      const currentLook = new THREE.Vector3().lerpVectors(
        fly.fromLookAt,
        fly.toLookAt,
        k,
      );
      camera.lookAt(currentLook);
      // Mémorise le lookAt courant pour qu'un prochain click capture le bon
      // `fromLookAt` (utile uniquement si on relance un fly sans avoir
      // démonté la scène — pas le cas normal puisqu'on navigue).
      orbitTargetRef.current.copy(currentLook);

      if (raw >= 1 && flyEndFiredRef.current !== fly.slug) {
        // Fire-once guard : router.push doit être atomique avec fin de fly.
        flyEndFiredRef.current = fly.slug;
        onFlyComplete(fly.slug);
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
        enableNodeDrag={!isFlying}
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
  const [isFlying, setIsFlying] = useState(false);
  // Ref source de vérité pour l'anim (lue à chaque frame, n'a pas besoin de re-render)
  const flyRef = useRef<FlySnapshot | null>(null);
  // Cible courante d'OrbitControls (mutée pendant le fly pour rester cohérent).
  const orbitTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  // Ref de la caméra exposée par le Canvas (peuplée via onCreated).
  const cameraRef = useRef<THREE.Camera | null>(null);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (node.placeholder) return;
    // Ignore clicks pendant le fly (la spec exige un comportement défini :
    // re-cliquer une autre bulle pendant l'anim est ignoré).
    if (flyRef.current !== null) return;

    const camera = cameraRef.current;
    if (!camera) return;

    // Snapshot des positions au moment du click (positions de node mises à
    // jour à chaque tick du force-graph par vasturiano, donc x/y/z dispo).
    const nx = node.x ?? 0;
    const ny = node.y ?? 0;
    const nz = node.z ?? 0;
    const nodePos = new THREE.Vector3(nx, ny, nz);

    // Direction depuis la bulle vers la caméra actuelle (on garde l'angle de
    // vue de l'utilisateur, on se rapproche juste).
    const dir = new THREE.Vector3().subVectors(camera.position, nodePos);
    if (dir.lengthSq() < 1e-6) {
      // edge case : caméra exactement sur la bulle (improbable mais safe)
      dir.set(0, 0, 1);
    }
    dir.normalize();

    const targetPos = new THREE.Vector3()
      .copy(nodePos)
      .addScaledVector(dir, BUBBLE_RADIUS * FLY_DISTANCE_FACTOR);

    flyRef.current = {
      slug: node.id,
      fromPos: camera.position.clone(),
      toPos: targetPos,
      fromLookAt: orbitTargetRef.current.clone(),
      toLookAt: nodePos.clone(),
      startTime: -1, // sera fixé au premier frame du fly
    };
    setIsFlying(true);
  }, []);

  const handleFlyComplete = useCallback(
    (slug: string) => {
      // Atomique : on push immédiatement à la fin du fly.
      // On ne reset PAS flyRef ici (la caméra reste à sa position finale,
      // la nav prend le relais — pas de saut visible).
      router.push(`/anomalie/${slug}`);
    },
    [router],
  );

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
    >
      <Canvas
        camera={{ position: [0, 0, 220], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, toneMappingExposure: 0.9 }}
        onCreated={({ camera }) => {
          cameraRef.current = camera;
        }}
      >
        <Backdrop />
        <ProceduralEnvironment />

        <ambientLight intensity={0.4} color="#202840" />
        <pointLight
          position={[60, 30, 30]}
          intensity={300}
          decay={1.5}
          distance={600}
          color="#66c8ff"
        />
        <pointLight
          position={[-50, 20, -20]}
          intensity={250}
          decay={1.5}
          distance={600}
          color="#ff66c8"
        />
        <pointLight
          position={[20, -40, 10]}
          intensity={180}
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
          isFlying={isFlying}
        />

        <OrbitControls
          enabled={!isFlying}
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
        }}
      >
        <div style={{ color: "rgba(120, 170, 255, 0.9)", marginBottom: 4 }}>
          graphe
        </div>
        <div style={{ color: "rgba(220, 230, 245, 0.85)" }}>
          {ANOMALIES.length} anomalie{ANOMALIES.length > 1 ? "s" : ""} · r3f-forcegraph
        </div>
      </div>

      {hoveredNode && !hoveredNode.placeholder && !isFlying && (
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
        }}
      >
        drag · scroll · click bulle pour ouvrir
      </div>
    </div>
  );
}
