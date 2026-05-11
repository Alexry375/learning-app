"use client";

/**
 * <BubbleSceneClient>
 *
 * Canvas + scene complète pour visualiser une (ou plusieurs) <Bubble>.
 * Sert de banc d'essai pour valider que le port R3F du proto 04 fonctionne
 * en environnement réel Next.js 16 + React 19 + Turbopack.
 *
 * Imports dynamiques côté page (ssr: false) — Three.js touche window et doit
 * être rendu client-side uniquement.
 */

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Bubble } from "./Bubble";
import { Backdrop } from "./Backdrop";
import { ProceduralEnvironment } from "./ProceduralEnvironment";

export default function BubbleSceneClient() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#050609",
        cursor: "grab",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, toneMappingExposure: 0.9 }}
      >
        {/* Backdrop : provides the colors that transmission refracts */}
        <Backdrop />

        {/* PMREM-quality reflections without HDR fetch */}
        <ProceduralEnvironment />

        {/* Subtle ambient + 2 colored fills (matches proto 04) */}
        <ambientLight intensity={0.4} color="#202840" />
        <pointLight
          position={[2.8, 1.4, -1.6]}
          intensity={4}
          decay={1.5}
          distance={25}
          color="#66c8ff"
        />
        <pointLight
          position={[-2.3, 0.6, 1.0]}
          intensity={3}
          decay={1.5}
          distance={25}
          color="#ff66c8"
        />

        {/* The bubble itself */}
        <Bubble />

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          minDistance={2.5}
          maxDistance={8}
        />

        <EffectComposer>
          <Bloom
            intensity={0.38}
            luminanceThreshold={0.8}
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
          prototype r3f
        </div>
        <div style={{ color: "rgba(220, 230, 245, 0.85)" }}>
          wobble transmission · next 16 + r3f v9
        </div>
      </div>
    </div>
  );
}
