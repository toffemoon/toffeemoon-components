import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  CatmullRomCurve3,
  ClampToEdgeWrapping,
  Color,
  MathUtils,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from "three";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import moonUrl from "../assets/moon/moon-texture-2048.jpg";

// ----------------------------------------------------------------------------
// Blacktop Moonrise — experimental prototype (?loader=blacktop).
// A puddle on night asphalt; a drop breaks the moon's reflection; the camera arcs
// from looking-down-at-water to looking-up-at-sky; the reflected moon match-cuts to
// the real moon, which zooms in to reveal Home. Self-contained R3F + GSAP.
// ----------------------------------------------------------------------------

const PUDDLE_CENTER = new Vector3(0, 0, 0);
const REAL_MOON_POS = new Vector3(0, 7.4, -13.0);

// camera arc: high top-down over the puddle -> lowering -> low, looking up at the sky
const CAM_CURVE = new CatmullRomCurve3(
  [
    new Vector3(0, 6.6, 0.7),
    new Vector3(0, 5.1, 3.4),
    new Vector3(0, 3.0, 6.4),
    new Vector3(0, 1.7, 8.8),
  ],
  false,
  "catmullrom",
  0.5,
);

const TIMING = { introFade: 0.5, still: 0.4, drop: 0.5, hold: 0.25, arc: 2.7, zoom: 1.1, reveal: 1.0, fadeOut: 0.4, minDisplay: 2600, maxReadyWait: 4200 };

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

// ---------- shaders ----------
const NOISE = /* glsl */ `
  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float a=0.5,s=0.0; for(int i=0;i<4;i++){ s+=a*vn(p); p*=2.0; a*=0.5; } return s; }
`;

const asphaltVert = /* glsl */ `varying vec2 vUv; varying vec3 vW;
  void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;
const asphaltFrag = /* glsl */ `precision highp float; varying vec2 vUv; varying vec3 vW; uniform vec3 uBase; uniform vec3 uSheen; uniform float uTime;
  ${NOISE}
  void main(){
    float grain=fbm(vUv*vec2(120.0,90.0));
    float coarse=fbm(vUv*7.0);
    float fleck=smoothstep(0.78,0.96,fbm(vUv*24.0));
    vec3 col=uBase*(0.4+1.15*coarse) + uBase*grain*0.7 + uSheen*fleck*0.06;
    // a soft column of moonlight on the wet road: vertical band under the moon, brighter far (-z)
    float band=exp(-pow(vW.x/3.2,2.0));
    float wet=band*smoothstep(-15.0,3.0,vW.z)*(0.45+0.55*grain);
    col+=uSheen*wet*0.6;
    // gentle far darkening — keep the road texture readable, never a pure-black vignette mid-frame
    float d=clamp(length(vW.xz)/30.0,0.0,1.0);
    col*=mix(1.0,0.3,d*d);
    gl_FragColor=vec4(col,1.0);
  }`;

const puddleVert = /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const puddleFrag = /* glsl */ `precision highp float; varying vec2 vUv;
  uniform float uTime; uniform float uImpactTime; uniform float uRefOp;
  uniform sampler2D uMoon; uniform vec3 uGlow; uniform vec3 uMilk; uniform vec3 uWater; uniform vec3 uSky;
  ${NOISE}
  void main(){
    vec2 p=vUv-0.5;
    // clearly irregular, organic puddle outline (multi-octave), never a clean disc/rect
    float ang=atan(p.y,p.x);
    float rEdge = 0.30
      + 0.075*fbm(vec2(ang*1.3+3.0,1.7))
      + 0.05*fbm(vec2(ang*2.7,5.0))
      + 0.03*sin(ang*5.0+1.0);
    float rad=length(p*vec2(1.2,1.0));
    float puddle=smoothstep(rEdge, rEdge-0.04, rad);
    if(puddle<0.01) discard;
    float age=max(0.0,uTime-uImpactTime);
    float on=step(0.0,uImpactTime);
    float d=length(p);
    float front=age*0.16;
    float ring=sin((d-front)*70.0)*smoothstep(0.10,0.0,abs(d-front))*exp(-age*1.2)*on;
    // reflected moon: clean silver disc, clamped sample (no wrap streaks), bent by the ripple
    vec2 disp = normalize(p+1e-4)*ring*0.04 + (fbm(vUv*4.0+uTime*0.02)-0.5)*0.004;
    float md=length((p+disp)*vec2(1.05,1.0));
    vec2 muv=clamp((p+disp)/0.42+0.5, 0.002, 0.998);
    float moonT=texture2D(uMoon,muv).r;
    float disc=1.0-smoothstep(0.16,0.205,md);
    // dark water with a faint cool sky reflection toward the rim
    vec3 water=mix(uWater, uSky, smoothstep(0.0,0.42,rad)*0.45) * (0.7+0.5*fbm(vUv*6.0+uTime*0.02));
    vec3 moon=mix(uGlow,uMilk,moonT)*moonT*disc*uRefOp;
    vec3 col=water+moon+uGlow*max(0.0,ring)*0.4;
    col *= 0.6 + 0.4*smoothstep(rEdge, rEdge-0.12, rad); // soft dark rim where water meets asphalt
    gl_FragColor=vec4(col, puddle);
  }`;

const moonVert = /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const moonFrag = /* glsl */ `precision highp float; varying vec2 vUv;
  uniform sampler2D uMoon; uniform vec3 uGlow; uniform vec3 uMilk; uniform float uOpacity;
  void main(){
    vec2 p=vUv-0.5; float r=length(p);
    float disc=1.0-smoothstep(0.46,0.5,r);
    if(disc<0.01) discard;
    float t=texture2D(uMoon,vUv).r;
    vec3 col=mix(uGlow,uMilk,t)*t;
    col+=uGlow*(1.0-smoothstep(0.40,0.5,r))*0.10;
    float halo=(1.0-smoothstep(0.46,0.62,r))*0.25;
    gl_FragColor=vec4(col, (disc + halo)*uOpacity);
  }`;

const skyFrag = /* glsl */ `precision highp float; varying vec3 vW; uniform vec3 uTop; uniform vec3 uHorizon;
  void main(){ float h=clamp(vW.y*0.04+0.5,0.0,1.0); gl_FragColor=vec4(mix(uHorizon,uTop,h),1.0); }`;
const skyVert = /* glsl */ `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;

// ---------- scene pieces ----------
function CameraRig({ stateRef }) {
  const { camera } = useThree();
  const look = useMemo(() => new Vector3(), []);
  useFrame(() => {
    const s = stateRef.current;
    const t = MathUtils.clamp(s.t ?? 0, 0, 1);
    const e = t * t * (3.0 - 2.0 * t);
    const pos = CAM_CURVE.getPoint(e);
    camera.position.copy(pos);
    look.lerpVectors(PUDDLE_CENTER, REAL_MOON_POS, MathUtils.smoothstep(t, 0.42, 0.66));
    camera.lookAt(look);
  });
  return null;
}

function Sky() {
  const uniforms = useMemo(() => ({ uTop: { value: new Color("#02060c") }, uHorizon: { value: new Color("#0a1622") } }), []);
  return (
    <mesh scale={[60, 60, 60]}>
      <sphereGeometry args={[1, 24, 16]} />
      <shaderMaterial vertexShader={skyVert} fragmentShader={skyFrag} uniforms={uniforms} side={1} depthWrite={false} />
    </mesh>
  );
}

function Asphalt() {
  const uniforms = useMemo(() => ({ uBase: { value: new Color("#0c141d") }, uSheen: { value: new Color("#2a4254") }, uTime: { value: 0 } }), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[44, 44, 1, 1]} />
      <shaderMaterial vertexShader={asphaltVert} fragmentShader={asphaltFrag} uniforms={uniforms} />
    </mesh>
  );
}

function Puddle({ stateRef, moon }) {
  const matRef = useRef(null);
  const fired = useRef(false);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uImpactTime: { value: -1 },
      uRefOp: { value: 1 },
      uMoon: { value: moon },
      uGlow: { value: new Color("#A8F4FF") },
      uMilk: { value: new Color("#EAF7F5") },
      uWater: { value: new Color("#06101a") },
      uSky: { value: new Color("#16323f") },
    }),
    [moon],
  );
  useFrame((_, delta) => {
    const u = matRef.current?.uniforms;
    if (!u) return;
    u.uTime.value += Math.min(delta, 1 / 30);
    const s = stateRef.current;
    u.uRefOp.value = s.refOp ?? 1;
    if ((s.impact ?? 0) >= 1 && !fired.current) {
      fired.current = true;
      u.uImpactTime.value = u.uTime.value;
    }
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
      <planeGeometry args={[6.4, 5.2, 1, 1]} />
      <shaderMaterial ref={matRef} vertexShader={puddleVert} fragmentShader={puddleFrag} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  );
}

function RealMoon({ stateRef, moon }) {
  const ref = useRef(null);
  const matRef = useRef(null);
  const { camera } = useThree();
  const uniforms = useMemo(
    () => ({ uMoon: { value: moon }, uGlow: { value: new Color("#A8F4FF") }, uMilk: { value: new Color("#EAF7F5") }, uOpacity: { value: 0 } }),
    [moon],
  );
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const s = stateRef.current;
    if (matRef.current) matRef.current.uniforms.uOpacity.value = s.realOp ?? 0;
    const sc = 3.2 * (s.moonScale ?? 1);
    m.scale.set(sc, sc, sc);
    m.lookAt(camera.position);
  });
  return (
    <mesh ref={ref} position={REAL_MOON_POS.toArray()}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={matRef} vertexShader={moonVert} fragmentShader={moonFrag} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  );
}

function Droplet({ stateRef }) {
  const ref = useRef(null);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const y = stateRef.current.dropY ?? 1.2;
    m.position.y = y;
    m.visible = y > 0.02 && y < 1.6;
    const sc = 0.045;
    m.scale.set(sc, sc * 1.3, sc);
  });
  return (
    <mesh ref={ref} position={[0, 1.2, 0]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color={"#dffaff"} transparent opacity={0.85} />
    </mesh>
  );
}

function Scene({ stateRef, onReady }) {
  const moon = useLoader(TextureLoader, moonUrl);
  useMemo(() => {
    moon.colorSpace = SRGBColorSpace;
    moon.wrapS = moon.wrapT = ClampToEdgeWrapping;
    moon.needsUpdate = true;
    return null;
  }, [moon]);
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return (
    <>
      <Sky />
      <Asphalt />
      <Puddle stateRef={stateRef} moon={moon} />
      <RealMoon stateRef={stateRef} moon={moon} />
      <Droplet stateRef={stateRef} />
      <CameraRig stateRef={stateRef} />
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

export function BlacktopMoonrise({ onReveal, onComplete }) {
  const rootRef = useRef(null);
  const stateRef = useRef({ t: 0, dropY: 1.25, refOp: 1, realOp: 0, moonScale: 1, impact: 0 });
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
      const s = stateRef.current;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      Object.assign(s, { t: 0, dropY: 1.25, refOp: 1, realOp: 0, moonScale: 1, impact: 0 });

      if (reduce) {
        const tl = gsap.timeline({ defaults: { ease: "power2.out" }, onComplete: complete });
        tl.to(root, { autoAlpha: 1, duration: 0.2 })
          .to(s, { t: 1, realOp: 1, refOp: 0, duration: 0.4 })
          .call(revealHome)
          .to(root, { "--reveal-radius": "175vmax", duration: 0.5, ease: "power2.inOut" })
          .to(root, { autoAlpha: 0, duration: 0.2 }, "<0.3");
        return () => tl.kill();
      }

      const ready = getReadyPromise();
      const minP = new Promise((r) => window.setTimeout(r, TIMING.minDisplay));

      const finish = contextSafe(() => {
        const tl = gsap.timeline({ defaults: { ease: "power2.inOut" }, onComplete: complete });
        // Impact: the drop falls and breaks the reflection
        tl.to(s, { dropY: 0.0, duration: TIMING.drop, ease: "power2.in" })
          .add(() => {
            s.impact = 1;
          })
          .to({}, { duration: TIMING.hold })
          .addLabel("arc")
          // Camera arc: from looking at the water to looking at the sky
          .to(s, { t: 1, duration: TIMING.arc, ease: "power2.inOut" }, "arc")
          // Match cut: a quick crossfade timed to the camera's fast sweep up to the moon
          .to(s, { refOp: 0, duration: 0.4, ease: "power2.in" }, "arc+=1.15")
          .to(s, { realOp: 1, duration: 0.45, ease: "power2.out" }, "arc+=1.18")
          // Lunar zoom + reveal after the arc settles on the real moon
          .to(s, { moonScale: 7.5, duration: TIMING.zoom, ease: "power2.in" }, "arc+=2.3")
          .add(revealHome, "arc+=2.85")
          .to(root, { "--reveal-radius": "175vmax", duration: TIMING.reveal, ease: "power3.inOut" }, "arc+=2.9")
          .to(root, { autoAlpha: 0, duration: TIMING.fadeOut, ease: "power2.out" }, ">-0.2");
      });

      const intro = gsap.timeline({ paused: true, defaults: { ease: "power3.out" }, onComplete: () => Promise.all([ready, minP]).then(finish) });
      intro.to(root, { autoAlpha: 1, duration: TIMING.introFade }).to({}, { duration: TIMING.still });

      const raf1 = requestAnimationFrame(() => requestAnimationFrame(() => intro.play(0)));
      return () => {
        cancelAnimationFrame(raf1);
        intro.kill();
      };
    },
    { scope: rootRef },
  );

  return (
    <div className="preloader blacktop-loader" ref={rootRef} role="status" aria-label="Loading Toffeemoon">
      {webgl && (
        <div className="blacktop-canvas" aria-hidden="true">
          <Canvas
            camera={{ position: [0, 6.6, 0.7], fov: 42, near: 0.1, far: 120 }}
            dpr={dpr}
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            frameloop="always"
          >
            <color attach="background" args={["#02060c"]} />
            <Suspense fallback={null}>
              <Scene stateRef={stateRef} onReady={() => {}} />
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
