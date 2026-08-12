import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Color, SRGBColorSpace, TextureLoader, Vector2 } from "three";
import moonUrl from "../assets/moon/moon-texture-2048.jpg";

// ----------------------------------------------------------------------------
// Surface Tension — Art Direction V3 "Black Mirror Macro".
// A macro shot on a black mirror of water. The moon is a reflection (background,
// slightly soft, lightly broken by the surface). The droplet is a foreground
// transparent lens (sharpest highlights, clearest edge). Depth/story/premium read
// come from the OPTICAL hierarchy, not from added objects — no rings, ellipses,
// window/long lines, scanlines, glitch, fog band, or star fields.
// 3D mesh stays OFF by default (shader-only droplet).
// ----------------------------------------------------------------------------
export const USE_3D_DROPLET = false;
function use3DActive() {
  if (typeof window === "undefined") return USE_3D_DROPLET;
  const q = new URLSearchParams(window.location.search).get("d3");
  if (q === "0") return false;
  if (q === "1") return true;
  if (window.innerWidth < 768) return false;
  return USE_3D_DROPLET;
}

// Debug: freeze the scene at one of the four acts (?stage=1|2|3|4) for styleframe review.
const MOON_R = 0.16;
// Lens fully COVERS the moon at its max (with a hair of margin into the water). The
// inside/outside focus-stack contrast still reads during the grow (lens < moon then).
const COVER = MOON_R * 1.03;
const STAGE_PRESETS = {
  "1": { dropRadius: 0.0, dropWobble: 0, dropFall: 0, impact: 0, impactDot: 0 }, // Still Moon (no central droplet)
  "2": { dropRadius: COVER, dropWobble: 0, dropFall: 0, impact: 0, impactDot: 0 }, // Lens Takes the Moon
  "3": { dropRadius: COVER, dropWobble: 1, dropFall: 0.12, impact: 0, impactDot: 0.7 }, // Depth Reversal
  "4": { dropRadius: 0.035, dropWobble: 0, dropFall: 1, impact: 0, impactDot: 1 }, // Impact (pre-strike bead)
};
function stageParam() {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get("stage");
  return STAGE_PRESETS[q] ? q : null;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform sampler2D uMoon;
  uniform float uDropRadius;
  uniform float uDropWobble;
  uniform float uDropFall;
  uniform float uLensGloss;
  uniform float uImpactTime;
  uniform float uRippleStrength;
  uniform float uImpactDot;   // 0..1 pre-impact caustic dot at moon centre
  uniform vec3 uDeepWater;
  uniform vec3 uAbyss;
  uniform vec3 uMoonMilk;
  uniform vec3 uMoonPale;
  uniform vec3 uMoonGlow;
  uniform float uMoonReady;   // 0 until the moon texture loads; gates procedural fallback face

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float ripple(float d, float age) {
    float waveFront = age * 0.5;
    // leading expanding ring (broader, gentler — not a tight bullseye)
    float lead = sin((d - waveFront) * 46.0) * smoothstep(0.2, 0.0, abs(d - waveFront));
    // trailing concentric ripples behind the front — the disturbed water keeps rippling
    float trail = sin(d * 44.0 - age * 12.0) * smoothstep(waveFront + 0.05, 0.0, d) * 0.4;
    return (lead + trail) * exp(-age * 1.4);    // faster decay -> the ripple (and the warp) settles sooner
  }

  const float MOON_R = 0.16;

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 uv = vUv;
    vec2 center = vec2(0.5, 0.5);
    vec2 q = uv - center;
    vec2 qc = vec2(q.x * aspect, q.y);
    float md = length(qc);
    vec2 dir = md > 1e-5 ? qc / md : vec2(0.0);
    vec2 dirUv = vec2(dir.x / aspect, dir.y);
    float px = 1.0 / uResolution.y;            // ~1px in uv units

    float impactAge = max(0.0, uTime - uImpactTime);
    float rip = ripple(md, impactAge) * uRippleStrength;

    // ---- droplet lens geometry (FOREGROUND layer) ----
    float R = uDropRadius;
    vec2 plc = qc;
    float ang = atan(plc.y, plc.x);
    float wob = uDropWobble * 0.018 * (vnoise(vec2(ang * 2.5, uTime * 1.1)) - 0.5);
    float effR = max(R * (1.0 + wob), 1e-4);
    float ld = length(plc);
    float rr = R > 1e-4 ? clamp(ld / effR, 0.0, 1.0) : 1.0;
    vec2 ldir = ld > 1e-5 ? plc / ld : vec2(0.0);
    float inside = R > 1e-4 ? 1.0 - smoothstep(effR * 0.97, effR * 1.03, ld) : 0.0;
    float depthFade = 1.0 - uDropFall;

    // ---- refraction + focus-stack magnification (inside lens: moon +~5% larger) ----
    float centerMag = mix(0.95, 1.0, uDropFall);
    float magF = mix(centerMag, 1.05, smoothstep(0.0, 1.0, rr * rr));
    vec2 qSample = mix(q, q * magF, inside);
    // slight radial misalignment of the moon surface near the lens edge
    qSample += ldir * vec2(1.0 / aspect, 1.0) * (rr * rr) * inside * 1.2 * px * depthFade;

    // ---- still reflection on CALM water — it ONLY warps once the drop's ripple arrives.
    // rip is 0 at rest (uRippleStrength 0); after impact it is an expanding concentric wave. ----
    vec2 dist = center + qSample;
    dist += dirUv * rip * 0.06;                    // the expanding ripple dynamically warps the reflection
    vec2 moonSampleP = dist;

    vec2 sampleUv = (moonSampleP - center) / vec2(MOON_R * 2.0 / aspect, MOON_R * 2.0) + 0.5;
    // sample the moon texture; fall back to a procedural moon face until it loads, so the moon is
    // NEVER absent (no Suspense gap, no blank moon on a slow / failed texture load).
    float texr = texture2D(uMoon, sampleUv).r;
    float procr = 0.5 + 0.30 * (vnoise(sampleUv * 6.0) - 0.5) + 0.16 * (vnoise(sampleUv * 15.0) - 0.5);
    float mr = mix(procr, texr, uMoonReady);
    float crater = clamp((mr - 0.5) * 1.0 + 0.5, 0.0, 1.0); // softer maria — a reflection, lower contrast

    // ---- CLEAN circular reflection at rest; the edge only breaks up as the ripple wave passes it ----
    float discR = MOON_R + rip * 0.05;                            // edge warps with the wave (0 at rest)
    float soft = mix(0.016, 0.006, inside) + abs(rip) * 0.25;     // edge frays where the wave is passing
    float disc = 1.0 - smoothstep(discR * (1.0 - soft), discR * (1.0 + soft + 0.02), md);

    // ---- compose: top-down black water (CALM) + the moon's still reflection in it ----
    vec3 water = mix(uAbyss, uDeepWater, smoothstep(0.25, 0.98, uv.y) * 0.5);
    // night-water 质感: a slow broad swell + fine glossy micro-grain — a still dark POOL, not flat black.
    // (material texture only, NOT geometric distortion — the moon itself warps only after impact.)
    float grain = vnoise(uv * vec2(aspect * 58.0, 58.0));
    float swell = vnoise(uv * vec2(aspect * 3.5, 3.5) + vec2(uTime * 0.012, -uTime * 0.009));
    water *= 0.9 + 0.2 * swell;                             // gentle depth unevenness of the pool
    water += uMoonGlow * (grain - 0.5) * 0.012;            // wet glossy speckle on the dark surface
    float ha = md / 0.34; float halo = exp(-ha * ha);       // soft glow hugging the moon
    water += uMoonGlow * halo * 0.06;                       // the moon's light pooling in the water
    float cg = md / 0.66; float centreGlow = exp(-cg * cg); // wide faint lift so the field reads as water, not void
    water += uDeepWater * centreGlow * 0.45 + uMoonGlow * centreGlow * 0.018;
    // a faint, EVEN sheen pooled softly under the moon (NOT a directional column / platform edge)
    vec2 sc = (qc - vec2(0.0, -MOON_R * 0.6)) / vec2(MOON_R * 1.5, MOON_R * 0.85);
    float sheen = exp(-dot(sc, sc));
    water += uMoonGlow * sheen * 0.03;
    float vig = smoothstep(1.05, 0.30, length(vec2(q.x * aspect, q.y)));
    water *= mix(0.74, 1.0, vig);                           // deep blue-black vignette at the edges
    water += vec3(0.005, 0.011, 0.017);                     // faint blue floor — never pure black
    // silver moonlight: shadow -> midtone -> highlight ramp; cyan only as a faint rim tint
    vec3 mShadow = vec3(0.251, 0.329, 0.357);  // #40545B
    vec3 mMid = vec3(0.682, 0.749, 0.753);     // #AEBFC0
    vec3 mHi = vec3(0.918, 0.969, 0.961);      // #EAF7F5
    vec3 silver = crater < 0.5 ? mix(mShadow, mMid, crater * 2.0) : mix(mMid, mHi, (crater - 0.5) * 2.0);
    silver = mix(silver, silver * vec3(0.93, 0.97, 1.03), 0.32); // faintly cool — seen through water (avoid cyan)
    float bright = mix(0.92, 1.04, inside);     // a reflection sits a touch dimmer than the real moon
    vec3 moonCol = silver * disc * bright;
    moonCol *= 0.96 + 0.08 * grain;             // faint wet micro-texture — the moon sits IN the water
    float moonRim = disc * smoothstep(MOON_R * 0.62, MOON_R, md);
    moonCol += uMoonGlow * moonRim * 0.05;      // faint cool rim only (no blue glowing ball)
    vec3 col = water + moonCol;


    // ---- droplet lens highlights (foreground: hardest, clearest) ----
    float edgeNoise = vnoise(vec2(ang * 1.6 + 3.0, uTime * 0.03));
    float bandPx = mix(3.0, 9.0, edgeNoise);    // thin, non-uniform meniscus (not a fat uniform ring)
    float bandT = bandPx * px;
    float edgeBand = inside * smoothstep(effR - bandT, effR, ld);
    // pool the bright meniscus on the lower-right (opposite the upper-left highlight); fade elsewhere
    float rimSide = 0.16 + 0.84 * smoothstep(-0.5, 1.0, dot(ldir, normalize(vec2(0.55, -0.7))));
    float edgeVar = (0.25 + 0.75 * edgeNoise) * rimSide;
    float innerDark = inside * smoothstep(effR * 0.5, effR * 0.92, ld) * (0.14 + 0.26 * (1.0 - edgeNoise));
    col -= vec3(0.012, 0.018, 0.026) * innerDark * depthFade * uLensGloss;
    col += mix(uMoonMilk, uMoonPale, 0.4) * edgeBand * edgeVar * 0.16 * depthFade * uLensGloss;
    // upper-left specular: hard + small, and it tightens/brightens as the impact dot rises
    vec2 ulC = center + vec2(-0.34, 0.34) * R;
    float ulD = length(vec2((uv.x - ulC.x) * aspect, uv.y - ulC.y));
    float ulShrink = R * 0.10 * (1.0 - 0.35 * uImpactDot);
    col += uMoonMilk * inside * smoothstep(ulShrink, 0.0, ulD) * (0.95 + 0.28 * uImpactDot) * uLensGloss;
    // faint lower-right return
    float lrArc = inside * smoothstep(effR * 0.84, effR, ld) * smoothstep(0.86, 0.999, dot(ldir, normalize(vec2(0.6, -0.7))));
    col += uMoonPale * lrArc * 0.14 * depthFade * uLensGloss;
    // outer contact shadow grounds the lens on the mirror
    float shadow = (1.0 - inside) * smoothstep(effR * 1.12, effR, ld) * step(1e-4, R);
    col -= vec3(0.016, 0.024, 0.032) * shadow * depthFade * uLensGloss;

    // ---- pre-impact depth cue: small caustic dot at the moon centre (4-10px, op->0.35, blur 8->1) ----
    float dotSigma = (3.0 + mix(8.0, 1.0, uImpactDot)) * px;
    float ds = md / dotSigma; float idot = exp(-ds * ds) * 0.42 * uImpactDot;
    col += uMoonMilk * idot;

    // ---- impact flash + ripple reveal ----
    float caustic = smoothstep(0.5, 1.0, uDropFall);
    col += uMoonGlow * caustic * smoothstep(0.018, 0.0, md) * 0.9;
    col += uMoonGlow * max(0.0, rip) * 0.5;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function WaterPlane({ stateRef, onReady, gloss }) {
  const matRef = useRef(null);
  const { size } = useThree();
  const firedImpact = useRef(false);
  const stage = useMemo(() => stageParam(), []);

  const uniforms = useMemo(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1;
    const h = typeof window !== "undefined" ? window.innerHeight : 1;
    return {
      uTime: { value: 0 },
      uResolution: { value: new Vector2(w, h) },
      uMoon: { value: null },
      uMoonReady: { value: 0 },
      uDropRadius: { value: 0 },
      uDropWobble: { value: 0 },
      uDropFall: { value: 0 },
      uLensGloss: { value: gloss },
      uImpactTime: { value: -999 },
      uRippleStrength: { value: 0 },
      uImpactDot: { value: 0 },
      uDeepWater: { value: new Color("#07131C") },
      uAbyss: { value: new Color("#02070B") },
      uMoonMilk: { value: new Color("#EAF7F5") },
      uMoonPale: { value: new Color("#DFFAFF") },
      uMoonGlow: { value: new Color("#A8F4FF") },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the moon texture imperatively (NOT via Suspense) so the plane renders immediately with a
  // procedural moon face and the real texture swaps in once ready — the moon is never absent, even
  // on a slow/cold load (which is what made the moon "disappear" behind the loading bar).
  useEffect(() => {
    let cancelled = false;
    new TextureLoader().load(moonUrl, (tex) => {
      if (cancelled) return;
      tex.colorSpace = SRGBColorSpace;
      const u = matRef.current?.uniforms;
      if (u) {
        u.uMoon.value = tex;
        u.uMoonReady.value = 1;
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uLensGloss.value = gloss;
  }, [gloss]);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useFrame((_, delta) => {
    const u = matRef.current?.uniforms;
    if (!u) return;
    u.uTime.value += Math.min(delta, 1 / 30);
    if (size.width > 0) u.uResolution.value.set(size.width, size.height);

    if (stage) {
      // frozen styleframe for review
      const p = STAGE_PRESETS[stage];
      u.uDropRadius.value = p.dropRadius;
      u.uDropWobble.value = p.dropWobble;
      u.uDropFall.value = p.dropFall;
      u.uImpactDot.value = p.impactDot;
      return;
    }

    const s = stateRef?.current;
    if (s) {
      u.uDropRadius.value = s.dropRadius ?? 0;
      u.uDropWobble.value = s.dropWobble ?? 0;
      u.uDropFall.value = s.dropFall ?? 0;
      u.uImpactDot.value = s.impactDot ?? 0;
      if ((s.impact ?? 0) >= 1 && !firedImpact.current) {
        firedImpact.current = true;
        u.uImpactTime.value = u.uTime.value;
        u.uRippleStrength.value = 1;
      }
    }
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

// Shelved 3D droplet experiment (only mounts when USE_3D_DROPLET / ?d3=1).
function Droplet3D({ stateRef }) {
  const ref = useRef(null);
  const { size } = useThree();
  useFrame((state) => {
    const s = stateRef?.current;
    const m = ref.current;
    if (!s || !m) return;
    const R = s.dropRadius ?? 0;
    const fall = s.dropFall ?? 0;
    const wob = s.dropWobble ?? 0;
    const px = R * size.height;
    m.visible = px > 1;
    if (!m.visible) return;
    const t = state.clock.elapsedTime;
    const w = 0.03 * wob * Math.sin(t * 22.0);
    m.scale.set(px * (1.0 + w), px * (1.0 - w), px * 0.5 * (1.0 - 0.4 * fall));
    m.material.opacity = 0.52 * (1.0 - 0.5 * fall);
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]} renderOrder={3}>
      <sphereGeometry args={[1, 64, 48]} />
      <meshPhysicalMaterial
        transmission={0.9}
        ior={1.333}
        roughness={0.09}
        thickness={0.35}
        metalness={0}
        clearcoat={1}
        clearcoatRoughness={0.04}
        specularIntensity={1}
        transparent
        opacity={0.52}
        depthTest={false}
        depthWrite={false}
        color={"#eaf7f5"}
        attenuationColor={"#a8f4ff"}
        attenuationDistance={3}
      />
    </mesh>
  );
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

export function SurfaceTensionScene({ stateRef, onReady }) {
  const webgl = useMemo(() => hasWebGL(), []);
  const use3D = useMemo(() => use3DActive(), []);
  const dpr = useMemo(() => {
    if (typeof window === "undefined") return 1;
    const cap = window.innerWidth < 768 ? 1.25 : 1.5;
    return Math.min(window.devicePixelRatio || 1, cap);
  }, []);

  useEffect(() => {
    if (!webgl) onReady?.();
  }, [webgl, onReady]);

  if (!webgl) return null;

  return (
    <div className="surface-canvas" aria-hidden="true">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 1], near: 0.01, far: 10 }}
        dpr={dpr}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <WaterPlane stateRef={stateRef} onReady={onReady} gloss={use3D ? 0.5 : 1.0} />
          {use3D && (
            <>
              <ambientLight intensity={0.6} />
              <directionalLight position={[-220, 260, 320]} intensity={3.4} />
              <Droplet3D stateRef={stateRef} />
            </>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
