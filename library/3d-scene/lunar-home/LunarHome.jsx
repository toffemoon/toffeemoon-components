import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ArrowUpRight, ChevronDown, RotateCcw } from "lucide-react";
import StaggeredText from "./staggered-text";
import { useI18n } from "../i18n.jsx";
import { featuredWorkItems, lunarEvidenceItems } from "../workData.js";
import {
  LunarEvidenceField,
  LunarScrollStory,
} from "./LunarScrollStory.jsx";
import { useLunarTransition } from "./LunarTransitionContext.jsx";
import { useLunarScrollTimeline } from "./useLunarScrollTimeline.js";

const LazyLunarScene = lazy(() =>
  import("./lunar/LunarScene.jsx").then((module) => ({
    default: module.LunarScene,
  })),
);

gsap.registerPlugin(useGSAP);

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function usePageVisible() {
  const [visible, setVisible] = useState(() =>
    typeof document === "undefined" ? true : !document.hidden,
  );

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return visible;
}

function detectWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    if (!context) return false;
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function useSceneCapability(enabled, coarsePointer, narrowViewport) {
  const [capability, setCapability] = useState("pending");

  useEffect(() => {
    if (!enabled) {
      setCapability("pending");
      return;
    }
    if (coarsePointer || narrowViewport) {
      setCapability("fallback");
      return;
    }
    setCapability(detectWebGL() ? "webgl" : "fallback");
  }, [coarsePointer, enabled, narrowViewport]);

  return capability;
}

export function LunarHome({ sceneEnabled }) {
  const { pick, t } = useI18n();
  const { registerHomeExit } = useLunarTransition();
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const trackRef = useRef(null);
  const evidenceRef = useRef(null);
  const sceneInvalidateRef = useRef(null);
  const scrollProgressRef = useRef({ value: 0 });
  const labelElementRef = useRef(null);
  const panelHeadingRef = useRef(null);
  const indexToggleRef = useRef(null);
  const indexItemRefs = useRef(new Map());
  const focusReturnRef = useRef(null);
  const transitionRef = useRef({ value: 0 });
  const exitProgressRef = useRef({ value: 0 });
  const transitionLockedRef = useRef(false);
  const modeRef = useRef("rest");
  const exitTimelineRef = useRef(null);
  const exitResolveRef = useRef(null);
  const returnPromiseRef = useRef(null);
  const wheelReturnPendingRef = useRef(false);

  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const coarsePointer = useMediaQuery("(pointer: coarse)");
  const narrowViewport = useMediaQuery("(max-width: 1120px)");
  const pageVisible = usePageVisible();
  const capability = useSceneCapability(
    sceneEnabled,
    coarsePointer,
    narrowViewport,
  );
  const staticFallback = capability === "fallback";
  const sceneAvailable = sceneEnabled && capability === "webgl";

  const [mode, setMode] = useState("rest");
  const [activeId, setActiveId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [scrollBeat, setScrollBeat] = useState("orbit");
  const [scrollActive, setScrollActive] = useState(false);

  const selectedItem = useMemo(
    () => featuredWorkItems.find((item) => item.id === selectedId) ?? null,
    [selectedId],
  );
  const activeItem = useMemo(
    () =>
      featuredWorkItems.find((item) => item.id === (activeId ?? selectedId)) ??
      null,
    [activeId, selectedId],
  );

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!sceneEnabled) return undefined;
    setHintVisible(true);
    const timer = window.setTimeout(() => setHintVisible(false), 6000);
    return () => window.clearTimeout(timer);
  }, [sceneEnabled]);

  useEffect(() => {
    if (!hasInteracted) return;
    setHintVisible(false);
  }, [hasInteracted]);

  useEffect(() => {
    if (staticFallback) setIndexOpen(true);
  }, [staticFallback]);

  useEffect(() => {
    if (!sceneAvailable) setSceneReady(false);
  }, [sceneAvailable]);

  useEffect(() => {
    if (mode !== "project-focus") return undefined;
    const frame = requestAnimationFrame(() => panelHeadingRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [mode]);

  const { contextSafe } = useGSAP({ scope: rootRef });

  const handleSceneInvalidateReady = useCallback((invalidate) => {
    sceneInvalidateRef.current = invalidate;
  }, []);

  const requestSceneFrame = useCallback(() => {
    sceneInvalidateRef.current?.();
  }, []);

  const handleScrollActiveChange = useCallback((active) => {
    if (active) {
      gsap.killTweensOf(transitionRef.current);
      transitionRef.current.value = 0;
      focusReturnRef.current = null;
      wheelReturnPendingRef.current = false;
      setSelectedId(null);
      setActiveId(null);
      setIndexOpen(false);
      setHintVisible(false);

      transitionLockedRef.current = true;
      modeRef.current = "scroll";
      setMode("scroll");
      setScrollActive(true);
      return;
    }

    setScrollActive(false);
    if (modeRef.current !== "scroll") return;
    transitionLockedRef.current = false;
    modeRef.current = "rest";
    setMode("rest");
  }, []);

  useLunarScrollTimeline({
    rootRef,
    stageRef,
    trackRef,
    evidenceRef,
    progressRef: scrollProgressRef,
    enabled: sceneAvailable && !reducedMotion,
    onBeatChange: setScrollBeat,
    onActiveChange: handleScrollActiveChange,
    requestSceneFrame,
  });

  useEffect(() => {
    if (sceneAvailable && !reducedMotion) return;
    scrollProgressRef.current.value = 0;
    setScrollBeat("orbit");
    handleScrollActiveChange(false);
  }, [handleScrollActiveChange, reducedMotion, sceneAvailable]);

  const setHoveredProject = (id) => {
    if (transitionLockedRef.current || selectedId) return;
    setHasInteracted(true);
    setActiveId(id);
    setMode(id ? "hover" : "rest");
  };

  const selectProject = contextSafe((id, source = "canvas") => {
    if (
      transitionLockedRef.current ||
      !["rest", "hover"].includes(modeRef.current)
    ) {
      return;
    }

    transitionLockedRef.current = true;
    focusReturnRef.current =
      source === "index"
        ? indexItemRefs.current.get(id)
        : indexToggleRef.current;
    setHasInteracted(true);
    setSelectedId(id);
    setActiveId(id);
    setMode("transitioning");
    modeRef.current = "transitioning";
    transitionRef.current.value = 0;
    gsap.killTweensOf(transitionRef.current);
    gsap.to(transitionRef.current, {
      value: 1,
      duration: reducedMotion || staticFallback ? 0.16 : 1.2,
      ease: reducedMotion || staticFallback ? "power1.out" : "power3.inOut",
      onComplete: () => {
        if (modeRef.current !== "transitioning") return;
        transitionLockedRef.current = false;
        modeRef.current = "project-focus";
        setMode("project-focus");
      },
    });
  });

  const returnToOrbit = contextSafe(() => {
    if (returnPromiseRef.current) return returnPromiseRef.current;
    if (!selectedId || transitionLockedRef.current) {
      return Promise.resolve(false);
    }

    transitionLockedRef.current = true;
    modeRef.current = "returning";
    setMode("returning");
    gsap.killTweensOf(transitionRef.current);

    returnPromiseRef.current = new Promise((resolve) => {
      let settled = false;
      const settle = (completed) => {
        if (settled) return;
        settled = true;
        returnPromiseRef.current = null;
        resolve(completed);
      };

      gsap.to(transitionRef.current, {
        value: 0,
        duration: reducedMotion || staticFallback ? 0.16 : 1.05,
        ease: reducedMotion || staticFallback ? "power1.out" : "power3.inOut",
        onComplete: () => {
          const requestedTarget = focusReturnRef.current;
          const focusTarget = requestedTarget?.isConnected
            ? requestedTarget
            : indexToggleRef.current;
          transitionLockedRef.current = false;
          modeRef.current = "rest";
          setSelectedId(null);
          setActiveId(null);
          setMode("rest");
          requestAnimationFrame(() => focusTarget?.focus());
          settle(true);
        },
        onInterrupt: () => settle(false),
      });
    });

    return returnPromiseRef.current;
  });

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && selectedId) {
        event.preventDefault();
        returnToOrbit();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [returnToOrbit, selectedId]);

  useEffect(() => {
    const root = rootRef.current;
    if (
      !root ||
      !selectedId ||
      !["transitioning", "project-focus", "returning"].includes(mode)
    ) {
      return undefined;
    }

    const onWheel = (event) => {
      if (event.deltaY <= 0) return;
      event.preventDefault();
      if (
        modeRef.current !== "project-focus" ||
        wheelReturnPendingRef.current
      ) {
        return;
      }

      wheelReturnPendingRef.current = true;
      returnToOrbit().finally(() => {
        wheelReturnPendingRef.current = false;
      });
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, [mode, returnToOrbit, selectedId]);

  useEffect(() => {
    const playExit = contextSafe(
      () =>
        new Promise((resolve) => {
          gsap.killTweensOf(transitionRef.current);
          exitTimelineRef.current?.kill();
          exitResolveRef.current?.(false);
          let settled = false;
          const settle = (completed) => {
            if (settled) return;
            settled = true;
            if (exitResolveRef.current === settle) exitResolveRef.current = null;
            exitTimelineRef.current = null;
            resolve(completed);
          };
          const completeExit = () => {
            const previousScrollBehavior =
              document.documentElement.style.scrollBehavior;
            document.documentElement.style.scrollBehavior = "auto";
            window.scrollTo(0, 0);
            window.requestAnimationFrame(() => {
              window.scrollTo(0, 0);
              document.documentElement.style.scrollBehavior =
                previousScrollBehavior;
            });
            settle(true);
          };

          exitResolveRef.current = settle;
          transitionLockedRef.current = true;

          const scrollProgress = scrollProgressRef.current.value;
          if (scrollProgress > 0.05) {
            modeRef.current = "scroll-exiting";
            setMode("scroll-exiting");
            exitTimelineRef.current = gsap.to(rootRef.current, {
              opacity: 0,
              duration: 0.35,
              ease: "power2.in",
              onComplete: completeExit,
              onInterrupt: () => settle(false),
            });
            return;
          }

          modeRef.current = "exiting";
          setMode("exiting");
          exitProgressRef.current.value = 0;
          exitTimelineRef.current = gsap
            .timeline({
              onComplete: completeExit,
              onInterrupt: () => settle(false),
            })
            .to(exitProgressRef.current, {
              value: 1,
              duration: 0.65,
              ease: "power2.inOut",
            })
            .to(
              rootRef.current,
              { autoAlpha: 0, duration: 0.5, ease: "power2.in" },
              0.12,
            );
        }),
    );
    const unregister = registerHomeExit(playExit);
    return () => {
      unregister();
      exitTimelineRef.current?.kill();
      exitResolveRef.current?.(false);
      exitTimelineRef.current = null;
    };
  }, [contextSafe, registerHomeExit]);

  const toggleIndex = () => {
    setHasInteracted(true);
    if (staticFallback) {
      setIndexOpen(true);
      return;
    }
    setIndexOpen((current) => !current);
  };

  const controlsLocked =
    scrollActive || mode === "exiting" || mode === "scroll-exiting";
  const projectInteractionEnabled = !controlsLocked;

  return (
    <section
      ref={rootRef}
      className={`lunar-home${sceneReady ? " is-scene-ready" : ""}${
        staticFallback ? " is-static" : ""
      }${reducedMotion ? " is-reduced-motion" : ""}`}
      data-scroll-beat={scrollBeat}
      data-scroll-active={scrollActive ? "true" : "false"}
      data-scene-mode={mode}
      data-lunar-mode={mode}
      aria-label={t("home.lunar.homeLabel")}
    >
      <div ref={stageRef} className="lunar-home__stage">
      <div className="lunar-home__atmosphere" aria-hidden="true" />

      {sceneAvailable && (
        <div className="lunar-home__scene-layer">
          <Suspense fallback={null}>
            <LazyLunarScene
              items={featuredWorkItems}
              activeId={activeId}
              selectedId={selectedId}
              mode={mode}
              transitionRef={transitionRef}
              exitProgressRef={exitProgressRef}
              scrollProgressRef={scrollProgressRef}
              scrollActive={scrollActive}
              onInvalidateReady={handleSceneInvalidateReady}
              projectInteractionEnabled={projectInteractionEnabled}
              reducedMotion={reducedMotion}
              pageVisible={pageVisible}
              discoveryCueId={
                !hasInteracted && hintVisible ? featuredWorkItems[0]?.id : null
              }
              labelElementRef={labelElementRef}
              onBodyHover={setHoveredProject}
              onBodySelect={(id) => selectProject(id, "canvas")}
              onFirstFrame={() => setSceneReady(true)}
            />
          </Suspense>
        </div>
      )}

      <div className="lunar-identity">
        <StaggeredText
          as="h1"
          text={t("home.lunar.identity")}
          segmentBy="words"
          delay={46}
          duration={0.72}
          direction="bottom"
          className="lunar-identity__name"
        />
        <p className="lunar-identity__roles">{t("home.lunar.roles")}</p>
        <span className="lunar-identity__rule" aria-hidden="true" />
        <p className="lunar-identity__intro">{t("home.lunar.intro")}</p>
      </div>

      <div
        ref={labelElementRef}
        className={`lunar-project-label${activeItem ? " is-visible" : ""}`}
        aria-hidden="true"
      >
        <span />
        {activeItem?.title}
      </div>

      {selectedItem && (
        <aside
          className="lunar-project-panel"
          aria-live="polite"
          inert={controlsLocked || undefined}
          aria-hidden={controlsLocked ? true : undefined}
        >
          <p className="lunar-project-panel__meta">
            {pick(selectedItem.type)} · {selectedItem.year}
          </p>
          <h2 ref={panelHeadingRef} tabIndex={-1} data-lunar-panel-heading>
            {selectedItem.title}
          </h2>
          <p>{pick(selectedItem.summary)}</p>
          <div className="lunar-project-panel__actions">
            <Link
              to={`/work#${selectedItem.id}`}
              data-lunar-view-link
            >
              {t("home.lunar.viewWork")}
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <button type="button" onClick={returnToOrbit}>
              <RotateCcw size={14} aria-hidden="true" />
              {t("home.lunar.back")}
            </button>
          </div>
        </aside>
      )}

      <div
        className="lunar-index"
        inert={controlsLocked || undefined}
        aria-hidden={controlsLocked ? true : undefined}
      >
        <button
          ref={indexToggleRef}
          type="button"
          className="lunar-index__toggle"
          onClick={toggleIndex}
          aria-expanded={indexOpen}
          aria-controls="lunar-project-index"
          data-lunar-index-toggle
        >
          {t("home.lunar.projectIndex")}
          <ChevronDown size={14} aria-hidden="true" />
        </button>

        {indexOpen && (
          <div className="lunar-index__list" id="lunar-project-index">
            {featuredWorkItems.map((item) => (
              <button
                key={item.id}
                ref={(node) => {
                  if (node) indexItemRefs.current.set(item.id, node);
                  else indexItemRefs.current.delete(item.id);
                }}
                type="button"
                className={item.id === (activeId ?? selectedId) ? "is-active" : ""}
                data-lunar-project={item.id}
                onFocus={() => setHoveredProject(item.id)}
                onBlur={() => setHoveredProject(null)}
                onPointerEnter={() => setHoveredProject(item.id)}
                onPointerLeave={() => setHoveredProject(null)}
                onClick={() => selectProject(item.id, "index")}
              >
                <span>{item.title}</span>
                <small>{pick(item.type)}</small>
              </button>
            ))}
          </div>
        )}
      </div>

      <p
        className={`lunar-discovery-hint${hintVisible ? " is-visible" : ""}`}
        aria-hidden="true"
      >
        {t("home.lunar.hint")}
      </p>
        <LunarScrollStory
          activeBeat={scrollBeat}
          reducedMotion={reducedMotion}
          staticScene={staticFallback}
        />
      </div>

      {sceneAvailable && !reducedMotion && (
        <div
          ref={trackRef}
          className="lunar-scroll-track"
          aria-hidden="true"
        />
      )}

      <LunarEvidenceField
        ref={evidenceRef}
        evidenceItems={lunarEvidenceItems}
      />
    </section>
  );
}
