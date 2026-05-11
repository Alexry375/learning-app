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
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import R3fForceGraph from "r3f-forcegraph";
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
};
type GraphLink = { source: string; target: string };
type GraphData = { nodes: GraphNode[]; links: GraphLink[] };

const BUBBLE_RADIUS = 14;

function buildGraphData(): GraphData {
  const nodes: GraphNode[] = ANOMALIES.map((a) => ({
    id: a.slug,
    label: a.title,
    domain: a.domain,
  }));

  // Ajouter quelques placeholders "à venir" pour que le graphe ait de la
  // matière visuelle dès maintenant. Seront remplacés au fil de l'ajout de
  // dossiers réels dans la registry.
  nodes.push({ id: "future-2", label: "À venir", placeholder: true });
  nodes.push({ id: "future-3", label: "À venir", placeholder: true });

  // Connexions arbitraires (à substancier plus tard avec une relation
  // sémantique réelle entre matières — couche partagée du substrat, etc.).
  const links: GraphLink[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    links.push({ source: nodes[i].id, target: nodes[i + 1].id });
  }
  // boucle de fermeture pour un layout plus rond
  if (nodes.length >= 3) {
    links.push({ source: nodes[nodes.length - 1].id, target: nodes[0].id });
  }

  return { nodes, links };
}

function GraphContent({
  graphData,
  onNodeHover,
  onNodeClick,
}: {
  graphData: GraphData;
  onNodeHover: (node: GraphNode | null) => void;
  onNodeClick: (node: GraphNode) => void;
}) {
  // any-typed ref — r3f-forcegraph's TS types don't expose tickFrame() cleanly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const materialsRef = useRef<BubbleMaterial[]>([]);

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
  });

  return (
    <R3fForceGraph
      ref={fgRef}
      graphData={graphData}
      nodeThreeObject={nodeThreeObject}
      nodeRelSize={BUBBLE_RADIUS}
      nodeLabel="label"
      linkColor={() => "#7a96d6"}
      linkOpacity={0.18}
      linkWidth={0.4}
      nodeOpacity={1}
      enableNodeDrag
      onNodeHover={(node) => onNodeHover((node as GraphNode) ?? null)}
      onNodeClick={(node) => onNodeClick(node as GraphNode)}
    />
  );
}

export default function GraphSceneClient() {
  const router = useRouter();
  const graphData = useMemo(buildGraphData, []);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.placeholder) return;
      // Pour l'instant : navigation directe vers la route anomalie existante.
      // À iterer : zoom caméra cinématique pré-navigation.
      router.push(`/anomalie/${node.id}`);
    },
    [router],
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#050609",
        cursor: hoveredNode && !hoveredNode.placeholder ? "pointer" : "grab",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 220], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, toneMappingExposure: 0.9 }}
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
        />

        <OrbitControls
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

      {hoveredNode && !hoveredNode.placeholder && (
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
