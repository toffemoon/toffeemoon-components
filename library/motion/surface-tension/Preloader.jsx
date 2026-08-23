import { useEffect, useRef, useState } from "react";
import { RippleReveal } from "./RippleReveal.jsx";
import { SurfaceTensionScene } from "./SurfaceTensionScene.jsx";
import { usePreloaderTimeline } from "./usePreloaderTimeline.js";

// 2026-08-23:blacktop / puddle 两个变体已从本库删除(v1.0 月球线弃案),
// ?loader= 的变体开关随之去掉,只留 Surface Tension 本体。
export function Preloader(props) {
  return <SurfaceTensionPreloader {...props} />;
}

// Surface Tension preloader. The growing droplet lens reads as a loading circle but is
// secretly a water droplet; on completion it collapses, falls, strikes the moon
// reflection, and the ripple reveals the prerendered Home (radial mask on the root).
function SurfaceTensionPreloader({ onComplete, onReveal }) {
  const rootRef = useRef(null);
  const rippleRef = useRef(null);
  // GSAP writes the droplet state each tick; the water scene reads it per frame.
  const sceneStateRef = useRef({ dropRadius: 0, dropWobble: 0, dropFall: 0, impact: 0 });
  const [sceneReady, setSceneReady] = useState(false);
  const [readyTimeout, setReadyTimeout] = useState(false);

  // Start even if the scene never signals ready (no WebGL, slow texture).
  useEffect(() => {
    const id = window.setTimeout(() => setReadyTimeout(true), 1500);
    return () => window.clearTimeout(id);
  }, []);

  usePreloaderTimeline(rootRef, {
    canStart: sceneReady || readyTimeout,
    onComplete,
    onReveal,
    sceneStateRef,
  });

  return (
    <div className="preloader surface-loader" ref={rootRef} role="status" aria-label="Loading Toffeemoon">
      {/* Header / logo / language are hidden during loading for immersion; the main site
          header fades in with the revealed page. */}
      <SurfaceTensionScene stateRef={sceneStateRef} onReady={() => setSceneReady(true)} />

      {/* Loading "water-line": a thin cool wet light below the moon; length tracks progress,
          dissolves when the droplet is released. Anchored to the same screen centre as the moon. */}
      <div className="surface-loadbar" aria-hidden="true" />

      <RippleReveal ref={rippleRef} />

      <span className="sr-only" role="status" aria-live="polite">
        Loading Toffeemoon
      </span>
    </div>
  );
}
