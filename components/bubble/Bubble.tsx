"use client";

/**
 * <Bubble>
 *
 * Composant R3F déclaratif. Wraps `createBubbleMaterial` du module
 * `./bubble-material`. Pour le rendu impératif (à l'intérieur de
 * `nodeThreeObject` de r3f-forcegraph), utiliser plutôt `createBubbleMesh`.
 *
 * Référence visuelle : `bulle-prototype/prototypes/04-wobble-transmission/`.
 */

import { useMemo, type ComponentProps } from "react";
import type * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  createBubbleMaterial,
  updateBubbleMaterial,
  type BubbleOptions,
} from "./bubble-material";

type BubbleProps = Omit<ComponentProps<"mesh">, "ref"> &
  BubbleOptions & {
    color?: THREE.ColorRepresentation;
    radius?: number;
  };

export function Bubble({
  color = "#ffffff",
  wobbleAmp = 0.08,
  wobbleFreq = 1.8,
  pulseRate = 0.1,
  radius = 1,
  ...meshProps
}: BubbleProps) {
  // Built once. Prop updates cascade via uniforms / .color.set without
  // re-running the shader patch.
  const material = useMemo(
    () => createBubbleMaterial({ color, wobbleAmp, wobbleFreq, pulseRate }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Sync prop changes into the live material
  useMemo(() => {
    material.color.set(color);
    material.userData.uAmp.value = wobbleAmp;
    material.userData.uFreq.value = wobbleFreq;
    material.userData.pulseRate = pulseRate;
  }, [material, color, wobbleAmp, wobbleFreq, pulseRate]);

  useFrame((state, dt) => {
    updateBubbleMaterial(material, dt, state.clock.elapsedTime);
  });

  return (
    <mesh {...meshProps}>
      <sphereGeometry args={[radius, 192, 192]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
