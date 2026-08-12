import { useEffect, useMemo, useRef, useState } from "react";
import { RippleReveal } from "./RippleReveal.jsx";
import { SurfaceTensionScene } from "./SurfaceTensionScene.jsx";
import { usePreloaderTimeline } from "./usePreloaderTimeline.js";
import { BlacktopMoonrise } from "./BlacktopMoonrise.jsx";
import { PuddleStage1 } from "./PuddleStage1.jsx";

function loaderVariant() {
  if (typeof window === "undefined") return "surface";
  const q = new URLSearchParams(window.location.search).get("loader");
  if (q === "puddle") return "puddle";
  if (q === "blacktop") return "blacktop";
  return "surface";
}

// Switch between the default Surface Tension loader and the experimental art-direction
// prototypes. Default = surface (committed main); ?loader=blacktop for the shader prototype;
// ?loader=puddle for the Blender-baked asphalt-puddle Stage 1 styleframe (add ?hold=1 to freeze).
export function Preloader(props) {
  const variant = useMemo(() => loaderVariant(), []);
  if (variant === "puddle") return <PuddleStage1 {...props} />;
  if (variant === "blacktop") return <BlacktopMoonrise {...props} />;
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
