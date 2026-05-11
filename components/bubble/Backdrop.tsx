"use client";

/**
 * <Backdrop>
 *
 * Sphère immense (rayon 30) avec un fragment shader qui peint 4 "spotlights"
 * colorés sur fond bleu nuit. C'est ce que la `<Bubble>` réfracte par
 * transmission — sans cette source de couleur, l'iridescence ne ressort pas.
 *
 * Port du backdrop du prototype 01/04.
 */

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export function Backdrop() {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vDir;
        uniform float uTime;
        void main() {
          vec3 base = mix(
            vec3(0.005, 0.008, 0.018),
            vec3(0.022, 0.030, 0.060),
            vDir.y * 0.5 + 0.5
          );
          vec3 p1 = normalize(vec3( 0.7,  0.6, -0.8));
          vec3 p2 = normalize(vec3(-0.8,  0.1, -0.7));
          vec3 p3 = normalize(vec3( 0.0, -0.6, -1.0));
          vec3 p4 = normalize(vec3(-0.4,  0.9, -0.3));
          base += vec3(0.18, 0.50, 1.00) * pow(max(0.0, dot(vDir, p1)), 22.0);
          base += vec3(1.00, 0.30, 0.65) * pow(max(0.0, dot(vDir, p2)), 26.0);
          base += vec3(1.00, 0.70, 0.30) * pow(max(0.0, dot(vDir, p3)), 22.0);
          base += vec3(0.65, 0.40, 1.00) * pow(max(0.0, dot(vDir, p4)), 26.0);
          // very slow modulation so the scene feels alive
          base *= 1.0 + 0.10 * sin(uTime * 0.15 + dot(vDir, vec3(3.1, 1.7, 2.3)));
          gl_FragColor = vec4(base, 1.0);
        }
      `,
      side: THREE.BackSide,
    });
  }, []);

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[30, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
