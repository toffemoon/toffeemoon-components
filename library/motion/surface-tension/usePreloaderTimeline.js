import { useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

// All Surface Tension phase timing in one place (seconds, except *Ms).
// The droplet lives in the WebGL scene; this timeline tweens a shared state object
// ({ dropRadius, dropWobble, dropFall, impact }) that SurfaceTensionScene reads per frame.
// Four acts: Still Mirror -> Lens Takes the Moon -> Depth Reversal -> Impact Reveal.
export const SURFACE_TENSION_TIMING = {
  introFade: 0.6,
  still: 0.55, // Act 1 — black water settles, moon reflection reads, the seed droplet sits
  fill: 2.2, // Act 2 — lens grows with simulated progress until it just covers the moon
  hold: 0.32, // Act 3 — covered pause; the viewer reads it as a finished loading mask
  tensionBreak: 0.34, // Act 3 — radial shiver + highlight tightens as the caustic dot appears
  fall: 0.5, // Act 4 — lens shrinks toward centre + recedes from the camera (depth axis)
  ripple: 0.95,
  reveal: 1.15,
  fadeOut: 0.42,
  minDisplay: 2500, // minimum visible time so the reversal reads
  maxReadyWait: 4200, // hard cap on waiting for page-ready
};

// Unified centre: the moon is a full-screen clip-space shader disc drawn at screen-centre
// (uv 0.5,0.5), and the reveal mask is `circle at 50% 50%` — so the moon's projected screen
// position IS the centre. The loading bar anchors to the same 50% in CSS. One source of truth.
const MOON_R = 0.16;
const COVER = MOON_R * 1.03; // lens fully covers the moon at max (focus-stack contrast reads during the grow)
const SEED = 0.0; // no central seed droplet — the lens grows from nothing during Lens Loading

function getReadyPromise() {
  const loadReady =
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
  const fontReady = document.fonts?.ready ?? Promise.resolve();
  const paintReady = new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const timeoutReady = new Promise((resolve) => window.setTimeout(resolve, SURFACE_TENSION_TIMING.maxReadyWait));
  return Promise.race([Promise.all([loadReady, fontReady, paintReady]), timeoutReady]);
}

function setBodyLocked(locked) {
  if (locked) {
    if (!document.body.dataset.preloaderPreviousOverflow) {
      document.body.dataset.preloaderPreviousOverflow = document.body.style.overflow || " ";
    }
    document.body.style.overflow = "hidden";
    return;
  }
  const previous = document.body.dataset.preloaderPreviousOverflow;
  document.body.style.overflow = previous === " " || previous == null ? "" : previous;
  delete document.body.dataset.preloaderPreviousOverflow;
}

export function usePreloaderTimeline(rootRef, { canStart = true, onComplete, onReveal, sceneStateRef } = {}) {
  useEffect(() => {
    setBodyLocked(true);
    return () => setBodyLocked(false);
  }, []);

  useGSAP(
    (context, contextSafe) => {
      const root = rootRef.current;
      if (!root || !canStart) return undefined;

      const q = gsap.utils.selector(root);
      const scene = sceneStateRef?.current ?? { dropRadius: 0, dropWobble: 0, dropFall: 0, impact: 0 };
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      gsap.set(q(".ripple-reveal__line, .ripple-reveal__impact"), { autoAlpha: 0, scale: 0.42 });
      gsap.set(q(".surface-loadbar"), { scaleX: 0.04, autoAlpha: 0, transformOrigin: "50% 50%" });
      scene.dropRadius = SEED;
      scene.dropWobble = 0;
      scene.dropFall = 0;
      scene.impact = 0;
      scene.impactDot = 0;

      let intro;
      let exit;
      let rafOne;
      let rafTwo;

      // Reduced motion: static water + moon, then a plain fade reveal. No fall/ripple.
      if (reduceMotion) {
        const reduced = gsap.timeline({ defaults: { ease: "power2.out" }, onComplete: complete });
        reduced
          .to(root, { autoAlpha: 1, duration: 0.2 })
          .to(scene, { dropRadius: COVER, duration: 0.3 }, "<")
          .call(revealHome)
          .to(root, { "--reveal-radius": "175vmax", duration: 0.5, ease: "power2.inOut" })
          .to(root, { autoAlpha: 0, duration: 0.2 }, "<0.3");
        return () => reduced.kill();
      }

      const readyPromise = getReadyPromise();
      const minPromise = new Promise((resolve) => window.setTimeout(resolve, SURFACE_TENSION_TIMING.minDisplay));

      // Completion: only runs once the page is ready AND min-display has elapsed.
      const finish = contextSafe(() => {
        exit = gsap.timeline({ defaults: { ease: "power3.inOut" }, onComplete: complete });
        exit
          // === Covered pause, then Act 3 — Ready Drop: the loading water-line dissolves, the
          //     droplet radially shrinks + recedes along the depth axis, the highlight tightens
          //     to a point, and a small caustic dot appears at the moon centre ===
          .to({}, { duration: SURFACE_TENSION_TIMING.hold }, 0)
          .to(
            scene,
            { impactDot: 0.7, duration: SURFACE_TENSION_TIMING.hold + SURFACE_TENSION_TIMING.tensionBreak, ease: "power1.in" },
            0,
          )
          // loading is done: the water-line dissolves outward during the covered pause, so it is
          // clearly gone before the droplet is released (never overlaps the fall)
          .to(q(".surface-loadbar"), { autoAlpha: 0, scaleX: 1.16, duration: 0.45, ease: "power2.in" }, 0)
          // surface tension shivers: radial edge wobble, the circle stays put
          .to(scene, { dropWobble: 1, duration: SURFACE_TENSION_TIMING.tensionBreak, ease: "sine.inOut" })
          // === Act 4 — Impact Reveal: shrink along the depth axis into a small bead, then strike ===
          .to(scene, { dropRadius: 0.03, dropFall: 1, dropWobble: 0, duration: SURFACE_TENSION_TIMING.fall, ease: "power2.in" })
          .to(scene, { impactDot: 1.0, duration: SURFACE_TENSION_TIMING.fall, ease: "power2.in" }, "<")
          // impact at the moon centre
          .add(() => {
            scene.impact = 1;
          }, ">-0.02")
          .addLabel("impact")
          .to(scene, { dropRadius: 0, duration: 0.12 }, "<")
          .to(scene, { impactDot: 0, duration: 0.3, ease: "power2.out" }, "<")
          .to(q(".ripple-reveal__impact"), { autoAlpha: 0.72, scale: 1.05, duration: 0.2, ease: "power2.out" }, "<")
          .to(
            q(".ripple-reveal__line"),
            {
              autoAlpha: (i) => [0.5, 0.32, 0.18][i] ?? 0.2,
              scale: (i) => [1.3, 1.9, 2.6][i] ?? 2,
              duration: SURFACE_TENSION_TIMING.ripple,
              stagger: 0.09,
              ease: "power2.out",
            },
            "<+=0.02",
          )
          // caustic point fades back out as the ripple expands
          .to(scene, { dropFall: 0, duration: 0.45, ease: "power2.out" }, "<")
          .to(q(".ripple-reveal__impact"), { autoAlpha: 0, scale: 2.2, duration: 0.5, ease: "power2.out" }, "<+=0.12")
          // reveal WHILE the ripple is still expanding — transition before the water settles
          .add(revealHome, "impact+=1.0")
          .to(root, { "--reveal-radius": "175vmax", duration: SURFACE_TENSION_TIMING.reveal, ease: "power3.inOut" }, "impact+=1.0")
          .to(q(".preloader-top"), { autoAlpha: 0, duration: 0.4, ease: "power2.out" }, "<+=0.2")
          .to(root, { autoAlpha: 0, duration: SURFACE_TENSION_TIMING.fadeOut, ease: "power2.out" }, ">-0.25");
      });

      intro = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out" },
        onComplete: () => Promise.all([readyPromise, minPromise]).then(finish),
      });
      intro
        .to(root, { autoAlpha: 1, duration: SURFACE_TENSION_TIMING.introFade })
        // the loading water-line fades up with the scene
        .to(q(".surface-loadbar"), { autoAlpha: 0.5, duration: SURFACE_TENSION_TIMING.introFade }, "<")
        // Act 1 — Still Moon: still black mirror + moon reflection + loading water-line (NO droplet)
        .to({}, { duration: SURFACE_TENSION_TIMING.still })
        // Act 2 — Lens Loading: the droplet grows from nothing to ~moon size while the water-line
        // fills with loading progress (same progress beat), decelerating onto full coverage.
        .to(scene, { dropRadius: COVER, duration: SURFACE_TENSION_TIMING.fill, ease: "power1.out" })
        .to(q(".surface-loadbar"), { scaleX: 1, duration: SURFACE_TENSION_TIMING.fill, ease: "power1.out" }, "<");

      rafOne = requestAnimationFrame(() => {
        rafTwo = requestAnimationFrame(() => intro.play(0));
      });

      return () => {
        cancelAnimationFrame(rafOne);
        cancelAnimationFrame(rafTwo);
        intro?.kill();
        exit?.kill();
      };
    },
    { dependencies: [canStart], scope: rootRef },
  );
}
