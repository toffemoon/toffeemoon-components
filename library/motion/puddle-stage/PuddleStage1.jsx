import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  ClampToEdgeWrapping,
  Color,
  LinearFilter,
  Mesh,
  MeshStandardMaterial,
  NoColorSpace,
  PlaneGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

import glbUrl from "../assets/asphalt/asphalt_puddle_patch.glb?url";
import baseUrl from "../assets/asphalt/asphalt_basecolor.png";
import normUrl from "../assets/asphalt/asphalt_normal.png";
import roughUrl from "../assets/asphalt/asphalt_roughness.png";
import aoUrl from "../assets/asphalt/asphalt_ao.png";
import maskUrl from "../assets/asphalt/puddle_mask.png";
import edgeUrl from "../assets/asphalt/puddle_edge_mask.png";
import moonUrl from "../assets/moon/moon-texture-2048.jpg";

// ----------------------------------------------------------------------------
// Puddle Stage 1 styleframe (?loader=puddle ; add &hold=1 to freeze).
// Night wet-asphalt hero patch (Blender-baked PBR). The road has a hole punched
// where the puddle is (baked puddle_mask). A REAL 3D moon, mirrored below the
// ground, is seen through that hole = a physically-correct reflection, clipped by
// the asphalt occlusion. A faint additive water layer adds the cool edge feather
// and the 1% city specks. No real sky/moon is visible top-down — only the
// reflection reads. The moon is a real, reusable sphere (later: camera arc reveals
// the above-ground instance; landing page reuses the same model).
// ----------------------------------------------------------------------------

const PATCH = 3;
const PUDDLE_Y = 0.004;
const MIRROR_Y = 0.004; // the water surface we mirror across

// Tunables for the still frame.
const MOON_POS = new Vector3(0, 6.0, -1.48); // the "real" moon (above, out of frame in Stage 1)
const MOON_RADIUS = 0.38;
const CAM_POS = [0, 4.0, 1.4];
const CAM_TARGET = new Vector3(0, 0, 0.25); // puddle hole on the plane
const CAM_FOV = 32;

// reflection = the real moon mirrored across the water plane
const MOON_REFLECTED = new Vector3(MOON_POS.x, 2 * MIRROR_Y - MOON_POS.y, MOON_POS.z);

const TIMING = { introFade: 0.6, hold: 0.4, reveal: 1.1, fadeOut: 0.4, minDisplay: 2600, maxReadyWait: 4200 };

function holdMode() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("hold") === "1";
}
function getReadyPromise() {
  const loadReady = document.readyState === "complete" ? Promise.resolve() : new Promise((r) => window.addEventListener("load", r, { once: true }));
  const fontReady = document.fonts?.ready ?? Promise.resolve();
  const paintReady = new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const timeoutReady = new Promise((r) => window.setTimeout(r, TIMING.maxReadyWait));
  return Promise.race([Promise.all([loadReady, fontReady, paintReady]), timeoutReady]);
}
function setBodyLocked(locked) {
  if (locked) {
    if (!document.body.dataset.preloaderPreviousOverflow) document.body.dataset.preloaderPreviousOverflow = document.body.style.overflow || " ";
    document.body.style.overflow = "hidden";
    return;
  }
  const prev = document.body.dataset.preloaderPreviousOverflow;
  document.body.style.overflow = prev === " " || prev == null ? "" : prev;
  delete document.body.dataset.preloaderPreviousOverflow;
}

function configureBaked(tex, color) {
  tex.flipY = false; // GLB (glTF) UV convention
  tex.colorSpace = color ? SRGBColorSpace : NoColorSpace;
  tex.wrapS = tex.wrapT = ClampToEdgeWrapping;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

// ---------- water surface overlay (additive: edge feather + 1% city) ----------
const NOISE = /* glsl */ `
  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
`;
const waterVert = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;
const waterFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uMask, uEdge;
  uniform float uTime;
  uniform vec3 uEdgeCol, uCool;
  varying vec2 vUv;
  ${NOISE}
  // a faint reflected city on the wet surface (1%): teal / white / red specks
  vec3 city(vec2 p){
    vec3 c = vec3(0.0);
    c += vec3(0.10,0.34,0.30) * exp(-pow(length((p-vec2(0.42,0.52))*vec2(1.7,1.0))/0.06,2.0));
    c += vec3(0.26,0.30,0.38) * exp(-pow(length((p-vec2(0.60,0.46))*vec2(1.6,1.0))/0.045,2.0));
    c += vec3(0.34,0.05,0.04) * exp(-pow(length((p-vec2(0.50,0.34))*vec2(1.5,1.0))/0.045,2.0));
    return c;
  }
  void main(){
    float mask = texture2D(uMask, vUv).r;
    if (mask < 0.5) discard;                 // confine to the puddle
    float edge = texture2D(uEdge, vUv).r;
    vec3 col = uEdgeCol * edge * 0.6;        // thin cool feather at the waterline
    col += city(vUv) * 0.5;                  // 1% city reflections
    col += uCool * 0.10;                      // faint cool lift so water isn't dead black
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ---------- scene pieces ----------
function moonMaterial(texture) {
  return new MeshStandardMaterial({
    color: new Color("#0b0e16"),
    emissive: new Color("#dce6fa"),
    emissiveMap: texture,
    emissiveIntensity: 1.12,
    roughness: 1,
    metalness: 0,
  });
}

function Moon({ texture, position }) {
  const ref = useRef(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.0006; // slow spin (same model reused later)
  });
  const material = useMemo(() => moonMaterial(texture), [texture]);
  return (
    <mesh ref={ref} position={position.toArray()} material={material}>
      <sphereGeometry args={[MOON_RADIUS, 64, 48]} />
    </mesh>
  );
}

function Asphalt({ gltf, maps }) {
  const mesh = useMemo(() => {
    let found = null;
    gltf.scene.traverse((o) => {
      if (o.isMesh && /asphalt/i.test(o.name)) found = o;
    });
    if (!found) return null;
    const geo = found.geometry;
    if (geo.attributes.uv && !geo.attributes.uv2) geo.setAttribute("uv2", geo.attributes.uv);
    const mat = new MeshStandardMaterial({
      map: maps.base,
      normalMap: maps.norm,
      roughnessMap: maps.rough,
      aoMap: maps.ao,
      aoMapIntensity: 1.0,
      roughness: 1.0,
      metalness: 0.0,
      color: new Color("#ffffff"),
    });
    mat.normalScale.set(1.0, 1.0);
    // punch a hole in the road where the puddle is (so the mirrored moon shows through)
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uHole = { value: maps.mask };
      shader.vertexShader = "varying vec2 vHoleUv;\n" + shader.vertexShader.replace("void main() {", "void main() {\n  vHoleUv = uv;");
      shader.fragmentShader =
        "uniform sampler2D uHole;\nvarying vec2 vHoleUv;\n" +
        shader.fragmentShader.replace("void main() {", "void main() {\n  if (texture2D(uHole, vHoleUv).r > 0.5) discard;");
    };
    mat.needsUpdate = true;
    found.material = mat;
    found.position.y = 0;
    return found;
  }, [gltf, maps]);
  if (!mesh) return null;
  return <primitive object={mesh} />;
}

function WaterSurface({ gltf, maps }) {
  const mesh = useMemo(() => {
    gltf.scene.updateMatrixWorld(true);
    let pm = null;
    gltf.scene.traverse((o) => {
      if (o.isMesh && /puddle/i.test(o.name)) pm = o;
    });
    const geo = pm ? pm.geometry.clone() : new PlaneGeometry(PATCH, PATCH).rotateX(-Math.PI / 2);
    const mat = new ShaderMaterial({
      vertexShader: waterVert,
      fragmentShader: waterFrag,
      uniforms: {
        uMask: { value: maps.mask },
        uEdge: { value: maps.edge },
        uTime: { value: 0 },
        uEdgeCol: { value: new Color("#3a6470") },
        uCool: { value: new Color("#13283a") },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const m = new Mesh(geo, mat);
    if (pm) pm.matrixWorld.decompose(m.position, m.quaternion, m.scale);
    m.position.y = PUDDLE_Y + 0.0005;
    m.renderOrder = 2;
    return m;
  }, [gltf, maps]);
  useFrame((_, dt) => {
    mesh.material.uniforms.uTime.value += Math.min(dt, 1 / 30);
  });
  return <primitive object={mesh} />;
}

function CameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(CAM_TARGET);
  }, [camera]);
  useFrame(() => camera.lookAt(CAM_TARGET));
  return null;
}

function Scene() {
  const gltf = useLoader(GLTFLoader, glbUrl);
  const [base, norm, rough, ao, mask, edge, moon] = useLoader(TextureLoader, [
    baseUrl,
    normUrl,
    roughUrl,
    aoUrl,
    maskUrl,
    edgeUrl,
    moonUrl,
  ]);
  const maps = useMemo(() => {
    configureBaked(base, true);
    configureBaked(norm, false);
    configureBaked(rough, false);
    configureBaked(ao, false);
    configureBaked(mask, false);
    configureBaked(edge, false);
    moon.colorSpace = SRGBColorSpace;
    moon.flipY = true;
    moon.needsUpdate = true;
    return { base, norm, rough, ao, mask, edge, moon };
  }, [base, norm, rough, ao, mask, edge, moon]);
  return (
    <>
      <ambientLight intensity={0.14} color={"#2b3d55"} />
      <directionalLight position={[1.4, 5.0, -1.0]} intensity={1.9} color={"#bcd0ff"} />
      <Asphalt gltf={gltf} maps={maps} />
      {/* the moon's mirror image, seen through the asphalt hole = the reflection */}
      <Moon texture={maps.moon} position={MOON_REFLECTED} />
      <WaterSurface gltf={gltf} maps={maps} />
      <CameraRig />
    </>
  );
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

export function PuddleStage1({ onReveal, onComplete }) {
  const rootRef = useRef(null);
  const webgl = useMemo(() => hasWebGL(), []);
  const dpr = useMemo(() => {
    if (typeof window === "undefined") return 1;
    return Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.5);
  }, []);

  useEffect(() => {
    setBodyLocked(true);
    return () => setBodyLocked(false);
  }, []);

  useGSAP(
    (context, contextSafe) => {
      const root = rootRef.current;
      if (!root) return undefined;
      const hold = holdMode();
      let firedReveal = false;
      let firedComplete = false;
      const revealHome = contextSafe(() => {
        if (firedReveal) return;
        firedReveal = true;
        onReveal?.();
      });
      const complete = contextSafe(() => {
        if (firedComplete) return;
        firedComplete = true;
        setBodyLocked(false);
        onComplete?.();
      });

      gsap.set(root, { autoAlpha: 0, "--reveal-radius": "0px" });
      const intro = gsap.timeline({ defaults: { ease: "power2.out" } });
      intro.to(root, { autoAlpha: 1, duration: TIMING.introFade });
      if (hold) return () => intro.kill();

      const ready = getReadyPromise();
      const minP = new Promise((r) => window.setTimeout(r, TIMING.minDisplay));
      const finish = contextSafe(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.inOut" }, onComplete: complete });
        tl.to({}, { duration: TIMING.hold })
          .add(revealHome)
          .to(root, { "--reveal-radius": "175vmax", duration: TIMING.reveal })
          .to(root, { autoAlpha: 0, duration: TIMING.fadeOut, ease: "power2.out" }, ">-0.2");
      });
      Promise.all([ready, minP]).then(finish);

      return () => intro.kill();
    },
    { scope: rootRef },
  );

  return (
    <div className="preloader blacktop-loader" ref={rootRef} role="status" aria-label="Loading Toffeemoon">
      {webgl && (
        <div className="blacktop-canvas" aria-hidden="true">
          <Canvas
            camera={{ position: CAM_POS, fov: CAM_FOV, near: 0.05, far: 120 }}
            dpr={dpr}
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            frameloop="always"
          >
            <color attach="background" args={["#03070d"]} />
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>
        </div>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        Loading Toffeemoon
      </span>
    </div>
  );
}
