/**
 * Bubble material factory — partagé entre <Bubble> (R3F) et `nodeThreeObject`
 * de r3f-forcegraph (qui veut un THREE.Object3D imperatif).
 *
 * Le shader patch (vertex wobble via onBeforeCompile) est défini ici une seule
 * fois. Le port direct du prototype 04 "wobble transmission".
 */

import * as THREE from "three";

export interface BubbleOptions {
  color?: THREE.ColorRepresentation;
  wobbleAmp?: number;
  wobbleFreq?: number;
  /** breathing rate of the pulse, in cycles per second */
  pulseRate?: number;
}

export interface BubbleMeshOptions extends BubbleOptions {
  radius?: number;
  /** sphere segments — lower for many bubbles to spare GPU */
  segments?: number;
}

/**
 * Augmented MeshPhysicalMaterial type — exposes the userData uniforms typed.
 * Use updateBubbleMaterial(mat, dt, t) every frame to drive them.
 */
export type BubbleMaterial = THREE.MeshPhysicalMaterial & {
  userData: {
    uTime: { value: number };
    uAmp: { value: number };
    uFreq: { value: number };
    uPulse: { value: number };
    pulseRate: number;
  };
};

export function createBubbleMaterial(opts: BubbleOptions = {}): BubbleMaterial {
  const {
    color = "#ffffff",
    wobbleAmp = 0.08,
    wobbleFreq = 1.8,
    pulseRate = 0.1,
  } = opts;

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
  }) as BubbleMaterial;

  mat.userData.uTime = { value: 0 };
  mat.userData.uAmp = { value: wobbleAmp };
  mat.userData.uFreq = { value: wobbleFreq };
  mat.userData.uPulse = { value: 0 };
  mat.userData.pulseRate = pulseRate;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = mat.userData.uTime;
    shader.uniforms.uAmp = mat.userData.uAmp;
    shader.uniforms.uFreq = mat.userData.uFreq;
    shader.uniforms.uPulse = mat.userData.uPulse;

    shader.vertexShader =
      /* glsl */ `
        uniform float uTime;
        uniform float uAmp;
        uniform float uFreq;
        uniform float uPulse;

        // Layered sines on local position — guaranteed to compile on all drivers.
        float wobble_displace(vec3 p) {
          float t = uTime * 0.6;
          float f = sin(p.x * uFreq + t)
                  + sin(p.y * uFreq * 1.15 + t * 1.3 + 0.7)
                  + sin(p.z * uFreq * 0.9  + t * 0.8 + 1.4)
                  + sin(length(p) * uFreq * 2.0 - t * 1.1);
          return f * 0.25 * uAmp + uPulse * 0.05;
        }
      ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      /* glsl */ `
        float d = wobble_displace(position);
        vec3 transformed = position + normal * d;
      `,
    );

    // Recompute normal analytically by finite diff along tangent + bitangent.
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
}

/**
 * Convenience : produce a complete mesh (sphere geom + bubble material).
 * Used by `nodeThreeObject` of r3f-forcegraph, which expects an imperative
 * THREE.Object3D.
 */
export function createBubbleMesh(opts: BubbleMeshOptions = {}): THREE.Mesh {
  const geom = new THREE.SphereGeometry(opts.radius ?? 1, opts.segments ?? 128, opts.segments ?? 128);
  const mat = createBubbleMaterial(opts);
  const mesh = new THREE.Mesh(geom, mat);
  // expose the bubble material on the mesh for convenient time-driving
  (mesh as unknown as THREE.Mesh & { bubbleMaterial: BubbleMaterial }).bubbleMaterial = mat;
  return mesh;
}

/**
 * Drive the wobble + pulse uniforms forward by one frame.
 * Call every frame in useFrame for every bubble material in the scene.
 */
export function updateBubbleMaterial(
  mat: BubbleMaterial,
  deltaTime: number,
  elapsedTime: number,
): void {
  mat.userData.uTime.value += deltaTime;
  mat.userData.uPulse.value =
    Math.sin(elapsedTime * Math.PI * 2 * mat.userData.pulseRate) * 0.5 + 0.5;
}

/**
 * Derive a soft pastel color from a string (slug). Same input → same color.
 * Used so each anomalie gets a stable, distinct hue without manual config.
 */
export function colorFromSlug(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
  }
  const hue = ((h % 360) + 360) % 360;
  return `hsl(${hue}, 65%, 78%)`;
}
