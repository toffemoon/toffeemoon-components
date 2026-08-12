import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clamp01, resolveScrollBeat } from "./lunar/lunarScrollModel.js";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function createLunarProgressApplier({
  rootRef,
  progressRef,
  onBeatChangeRef,
  onActiveChangeRef,
  requestSceneFrameRef,
}) {
  const initialProgress = clamp01(progressRef.current?.value);
  let previousBeat = resolveScrollBeat(initialProgress);
  let previousActive = initialProgress > 0.02;

  return function applyProgress(self) {
    const progress = clamp01(self?.progress);
    progressRef.current.value = progress;
    rootRef.current.dataset.scrollProgress = progress.toFixed(4);

    const beat = resolveScrollBeat(progress);
    if (beat !== previousBeat) {
      previousBeat = beat;
      onBeatChangeRef.current?.(beat);
    }

    const active = progress > 0.02;
    if (active !== previousActive) {
      previousActive = active;
      onActiveChangeRef.current?.(active);
    }

    requestSceneFrameRef.current?.();
  };
}

export function useLunarScrollTimeline({
  rootRef,
  stageRef,
  trackRef,
  evidenceRef,
  progressRef,
  enabled,
  onBeatChange,
  onActiveChange,
  requestSceneFrame,
}) {
  const onBeatChangeRef = useRef(onBeatChange);
  const onActiveChangeRef = useRef(onActiveChange);
  const requestSceneFrameRef = useRef(requestSceneFrame);

  onBeatChangeRef.current = onBeatChange;
  onActiveChangeRef.current = onActiveChange;
  requestSceneFrameRef.current = requestSceneFrame;

  useGSAP(
    () => {
      const root = rootRef.current;
      const stage = stageRef.current;
      const track = trackRef.current;
      const evidence = evidenceRef.current;
      const progress = progressRef.current;

      if (!enabled || !root || !stage || !track || !evidence || !progress) {
        return undefined;
      }

      const applyProgress = createLunarProgressApplier({
        rootRef,
        progressRef,
        onBeatChangeRef,
        onActiveChangeRef,
        requestSceneFrameRef,
      });
      const trigger = ScrollTrigger.create({
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        pin: stage,
        pinSpacing: false,
        invalidateOnRefresh: true,
        onUpdate: applyProgress,
        onRefresh: (self) => applyProgress(self),
      });
      const restoreFrame = requestAnimationFrame(() => applyProgress(trigger));

      return () => {
        cancelAnimationFrame(restoreFrame);
        trigger.kill();
        progressRef.current.value = 0;
        delete root.dataset.scrollProgress;
        requestSceneFrameRef.current?.();
      };
    },
    {
      dependencies: [
        enabled,
        rootRef,
        stageRef,
        trackRef,
        evidenceRef,
        progressRef,
      ],
      scope: rootRef,
      revertOnUpdate: true,
    },
  );
}
