"use client";

/**
 * <Bubble>
 *
 * Port R3F du prototype 04 "wobble transmission" — soap-bubble vivante.
 *
 * Caractéristiques :
 * - `MeshPhysicalMaterial` avec transmission + iridescence + clearcoat
 * - Vertex wobble injecté via `onBeforeCompile` (uniformes `uTime/uAmp/uFreq/uPulse`)
 * - Recalcul analytique de la normale pour un éclairage correct sur la surface déformée
 * - Props : `color`, `wobbleAmp`, `wobbleFreq`, `radius`, plus tous les attributs `<mesh>` standards
 *
 * Usage typique :
 * ```tsx
 * <Bubble color="#a8c0ff" wobbleAmp={0.08} position={[2, 0, 0]} />
 * ```
 *
 * Quand on passera au graphe : ce composant deviendra le `nodeThreeObject` de
 * `r3f-forcegraph`, avec une seed couleur dérivée du nom de matière.
 */

import { useMemo, type ComponentProps } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

type BubbleProps = Omit<ComponentProps<"mesh">, "ref"> & {
  color?: THREE.ColorRepresentation;
  wobbleAmp?: number;
  wobbleFreq?: number;
  radius?: number;
  /** breathing rate of the pulse, in cycles per second */
  pulseRate?: number;
};

export function Bubble({
  color = "#ffffff",
  wobbleAmp = 0.08,
  wobbleFreq = 1.8,
  radius = 1,
  pulseRate = 0.1, // ~ one breath per ~10 seconds
  ...meshProps
}: BubbleProps) {
  // Material is created once and never re-created — props that affect uniforms
  // (color, wobbleAmp, wobbleFreq) are reflected via material.userData uniforms.
  const material = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
      roughness: 0.04,
      metalness: 0.0,
      transmission: 1.0,
      thickness: 0.7,
      ior: 1.5,
      attenuationDistance: 1.8,
      attenuationColor: new THREE.Color("#c8d0ff"),
      iridescence: 1.0,
      iridescenceIOR: 1.4,
      iridescenceThicknessRange: [180, 700],
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.2,
    });

    // Shared uniforms — material.userData carries them so we can refer in
    // useFrame without re-running the onBeforeCompile patch.
    mat.userData.uTime = { value: 0 };
    mat.userData.uAmp = { value: wobbleAmp };
    mat.userData.uFreq = { value: wobbleFreq };
    mat.userData.uPulse = { value: 0 };

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = mat.userData.uTime;
      shader.uniforms.uAmp = mat.userData.uAmp;
      shader.uniforms.uFreq = mat.userData.uFreq;
      shader.uniforms.uPulse = mat.userData.uPulse;

      // Inject the wobble function above the vertex shader main
      shader.vertexShader =
        /* glsl */ `
          uniform float uTime;
          uniform float uAmp;
          uniform float uFreq;
          uniform float uPulse;

          // Vertex displacement using layered sines on local position.
          // No 3D noise → guaranteed to compile on all WebGL drivers.
          float wobble_displace(vec3 p) {
            float t = uTime * 0.6;
            float f = sin(p.x * uFreq + t)
                    + sin(p.y * uFreq * 1.15 + t * 1.3 + 0.7)
                    + sin(p.z * uFreq * 0.9  + t * 0.8 + 1.4)
                    + sin(length(p) * uFreq * 2.0 - t * 1.1);
            return f * 0.25 * uAmp + uPulse * 0.05;
          }
        ` + shader.vertexShader;

      // Patch begin_vertex : add displacement along normal
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        /* glsl */ `
          float d = wobble_displace(position);
          vec3 transformed = position + normal * d;
        `,
      );

      // Patch beginnormal_vertex : recompute normal analytically by finite diff
      // along two tangent directions. Needed otherwise lighting looks wrong on
      // the deformed surface.
      shader.vertexShader = shader.vertexShader.replace(
        "#include <beginnormal_vertex>",
        /* glsl */ `
          vec3 wobble_tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0) + 1e-4));
          vec3 wobble_bitangent = normalize(cross(normal, wobble_tangent));
          float wobble_eps = 0.001;
          float wobble_dC = wobble_displace(position);
          float wobble_dT = wobble_displace(position + wobble_tangent  * wobble_eps);
          float wobble_dB = wobble_displace(position + wobble_bitangent * wobble_eps);
          vec3 wobble_pC = position + normal * wobble_dC;
          vec3 wobble_pT = position + wobble_tangent  * wobble_eps + normal * wobble_dT;
          vec3 wobble_pB = position + wobble_bitangent * wobble_eps + normal * wobble_dB;
          vec3 objectNormal = normalize(cross(wobble_pT - wobble_pC, wobble_pB - wobble_pC));
        `,
      );
    };

    return mat;
    // intentionally not depending on color/wobbleAmp/wobbleFreq — they are
    // synced via uniforms below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync prop changes into the live material
  useMemo(() => {
    material.color.set(color);
    material.userData.uAmp.value = wobbleAmp;
    material.userData.uFreq.value = wobbleFreq;
  }, [material, color, wobbleAmp, wobbleFreq]);

  // Drive the time / pulse uniforms each frame
  useFrame((state, dt) => {
    material.userData.uTime.value += dt;
    material.userData.uPulse.value =
      Math.sin(state.clock.elapsedTime * Math.PI * 2 * pulseRate) * 0.5 + 0.5;
  });

  return (
    <mesh {...meshProps}>
      <sphereGeometry args={[radius, 192, 192]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
