import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { FogExp2 } from "three";
import { LunarCameraRig } from "./LunarCameraRig.jsx";
import { MoonBody } from "./MoonBody.jsx";
import { ProjectSystem } from "./ProjectSystem.jsx";

const CONTINUOUS_MODES = new Set([
  "rest",
  "hover",
  "transitioning",
  "returning",
  "exiting",
]);

export function resolveLunarFrameloop(
  mode,
  scrollActive,
  reducedMotion,
  pageVisible,
) {
  if (!pageVisible || reducedMotion || scrollActive) return "demand";
  return CONTINUOUS_MODES.has(mode) ? "always" : "demand";
}

function InvalidationBridge({ onReady }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    onReady?.(invalidate);
    return () => onReady?.(null);
  }, [invalidate, onReady]);

  return null;
}

function FirstFrame({ onFirstFrame }) {
  const fired = useRef(false);
  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    queueMicrotask(() => onFirstFrame?.());
  });
  return null;
}

export function LunarScene({
  items,
  activeId,
  selectedId,
  mode,
  transitionRef,
  exitProgressRef,
  scrollProgressRef,
  scrollActive = false,
  onInvalidateReady,
  projectInteractionEnabled = true,
  reducedMotion,
  pageVisible,
  discoveryCueId,
  labelElementRef,
  onBodyHover,
  onBodySelect,
  onFirstFrame,
}) {
  const systemRef = useRef(null);
  const moonRef = useRef(null);
  const bodyRefs = useRef(new Map());
  const scrollAuthorityRef = useRef(false);
  const fog = useMemo(() => new FogExp2("#02070b", 0.036), []);
  const motionAllowed = pageVisible && !reducedMotion;
  const frameloop = resolveLunarFrameloop(
    mode,
    scrollActive,
    reducedMotion,
    pageVisible,
  );

  return (
    <div className="lunar-canvas" aria-hidden="true">
      <Canvas
        camera={{ fov: 36, near: 0.1, far: 80, position: [0, 0.25, 11.8] }}
        dpr={[1, 1.5]}
        frameloop={frameloop}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onPointerMissed={
          projectInteractionEnabled ? () => onBodyHover(null) : undefined
        }
      >
        <InvalidationBridge onReady={onInvalidateReady} />
        <primitive object={fog} attach="fog" />
        <ambientLight intensity={0.16} color="#729095" />
        <hemisphereLight args={["#b7d5d8", "#010407", 0.42]} />
        <directionalLight
          position={[6.8, 7.5, 7.2]}
          intensity={3.2}
          color="#eaf7f5"
        />
        <directionalLight
          position={[-6, -2, 4]}
          intensity={0.42}
          color="#3b7a82"
        />

        <MoonBody
          ref={moonRef}
          motionAllowed={motionAllowed}
          mode={mode}
          scrollAuthorityRef={scrollAuthorityRef}
        />
        <ProjectSystem
          items={items}
          systemRef={systemRef}
          bodyRefs={bodyRefs}
          activeId={activeId}
          selectedId={selectedId}
          discoveryCueId={discoveryCueId}
          motionAllowed={motionAllowed}
          mode={mode}
          scrollAuthorityRef={scrollAuthorityRef}
          projectInteractionEnabled={projectInteractionEnabled}
          onBodyHover={onBodyHover}
          onBodySelect={onBodySelect}
        />
        <LunarCameraRig
          systemRef={systemRef}
          moonRef={moonRef}
          bodyRefs={bodyRefs}
          selectedId={selectedId}
          activeId={activeId}
          mode={mode}
          transitionRef={transitionRef}
          exitProgressRef={exitProgressRef}
          scrollProgressRef={scrollProgressRef}
          scrollActive={scrollActive}
          scrollAuthorityRef={scrollAuthorityRef}
          projectInteractionEnabled={projectInteractionEnabled}
          reducedMotion={reducedMotion}
          pageVisible={pageVisible}
          labelElementRef={labelElementRef}
        />
        <FirstFrame onFirstFrame={onFirstFrame} />
      </Canvas>
    </div>
  );
}
