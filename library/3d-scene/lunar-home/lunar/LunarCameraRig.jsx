import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Euler,
  MathUtils,
  Quaternion,
  Vector3,
} from "three";
import {
  getFocusEuler,
  LUNAR_BODY_LAYOUT,
  resolveTransitionProgress,
} from "./lunarModel.js";
import { resolveScrollPose } from "./lunarScrollModel.js";

const REST_CAMERA = new Vector3(0, 0.25, 11.8);
const REST_TARGET = new Vector3(-0.45, -0.12, -0.45);
const REST_MOON = new Vector3(-3.55, -0.25, -1.1);
const SCROLL_CENTER_CAMERA = new Vector3(0, 0.2, 12.6);
const SCROLL_CENTER_TARGET = new Vector3(0, -0.05, -0.9);
const SCROLL_CENTER_MOON = new Vector3(0, -0.05, -8.5);
const SCROLL_HORIZON_CAMERA = new Vector3(0, 0.28, 12.6);
const SCROLL_HORIZON_TARGET = new Vector3(0, -1.85, -1.1);
const SCROLL_HORIZON_MOON = new Vector3(0, -8.55, -5.7);
const FOCUS_MOON = new Vector3(-4.25, -0.48, -1.72);
const FOCUS_CAMERA_OFFSET = new Vector3(2.15, 0.72, 6.7);
const FOCUS_LOOK_OFFSET = new Vector3(-1.25, -0.04, 0);
const FOCUS_BODY_SCALE = 0.68;
const REST_SYSTEM_Z = -0.35;
const Y_AXIS = new Vector3(0, 1, 0);
const PROJECT_AUTHORITY_MODES = new Set([
  "transitioning",
  "returning",
  "project-focus",
]);

export function resolveLunarSceneAuthority(
  mode,
  selectedId,
  scrollActive,
  scrollPoseActive,
  scrollSnapshotActive,
) {
  if (mode === "exiting") return "route";
  if (selectedId || PROJECT_AUTHORITY_MODES.has(mode)) return "project";
  if (scrollActive || scrollPoseActive || scrollSnapshotActive) return "scroll";
  return "orbit";
}

export function createLunarScrollAuthorityState() {
  return {
    snapshotActive: false,
    releasePending: false,
    captureRequested: false,
  };
}

export function beginLunarScrollAuthorityFrame(
  state,
  scrollAuthorityRef,
  mode,
  selectedId,
  scrollActive,
  scrollPoseActive,
) {
  if (state.releasePending) {
    state.snapshotActive = false;
    state.releasePending = false;
  }
  state.captureRequested = false;

  const authority = resolveLunarSceneAuthority(
    mode,
    selectedId,
    scrollActive,
    scrollPoseActive,
    state.snapshotActive,
  );
  if (authority === "scroll" && !state.snapshotActive) {
    state.snapshotActive = true;
    state.captureRequested = true;
  }
  scrollAuthorityRef.current = authority === "scroll";
  return authority;
}

export function completeLunarScrollAuthorityFrame(
  state,
  progress,
  scrollActive,
) {
  if (state.snapshotActive && progress <= 0 && !scrollActive) {
    state.releasePending = true;
  }
}

export function applyLunarScrollComposition(
  scrollPose,
  cameraPosition,
  cameraTarget,
  moonPosition,
) {
  cameraPosition
    .lerpVectors(REST_CAMERA, SCROLL_CENTER_CAMERA, scrollPose.centerProgress)
    .lerp(SCROLL_HORIZON_CAMERA, scrollPose.horizonProgress);
  cameraTarget
    .lerpVectors(REST_TARGET, SCROLL_CENTER_TARGET, scrollPose.centerProgress)
    .lerp(SCROLL_HORIZON_TARGET, scrollPose.horizonProgress);
  moonPosition
    .lerpVectors(REST_MOON, SCROLL_CENTER_MOON, scrollPose.centerProgress)
    .lerp(SCROLL_HORIZON_MOON, scrollPose.horizonProgress);
}

export function LunarCameraRig({
  systemRef,
  moonRef,
  bodyRefs,
  selectedId,
  activeId,
  mode,
  transitionRef,
  exitProgressRef,
  scrollProgressRef,
  scrollActive = false,
  scrollAuthorityRef,
  projectInteractionEnabled = true,
  reducedMotion,
  pageVisible,
  labelElementRef,
}) {
  const { camera, invalidate, pointer, size } = useThree();
  const focusQuaternionById = useMemo(() => {
    const map = new Map();
    const euler = new Euler();
    for (let index = 0; index < LUNAR_BODY_LAYOUT.length; index += 1) {
      const layout = LUNAR_BODY_LAYOUT[index];
      const focusEuler = getFocusEuler(layout.position);
      euler.set(focusEuler[0], focusEuler[1], focusEuler[2]);
      map.set(layout.id, new Quaternion().setFromEuler(euler));
    }
    return map;
  }, []);
  const scrollPose = useMemo(() => resolveScrollPose(0, {}), []);
  const scrollAuthorityState = useMemo(
    () => createLunarScrollAuthorityState(),
    [],
  );
  const selectionId = useRef(null);
  const selectionStartQuaternion = useRef(new Quaternion());
  const exitSnapshot = useRef(new Quaternion());
  const exitSnapshotActive = useRef(false);
  const scrollSystemQuaternion = useRef(new Quaternion());
  const scrollMoonQuaternion = useRef(new Quaternion());
  const scrollMoonTurn = useRef(new Quaternion());
  const selectedWorld = useRef(new Vector3());
  const focusCamera = useRef(new Vector3());
  const focusLook = useRef(new Vector3());
  const cameraPosition = useRef(new Vector3());
  const cameraTarget = useRef(new Vector3());
  const projected = useRef(new Vector3());
  const workingQuaternion = useRef(new Quaternion());
  const exitTurn = useRef(new Quaternion());

  useEffect(() => {
    invalidate();
  }, [
    activeId,
    invalidate,
    mode,
    pageVisible,
    projectInteractionEnabled,
    reducedMotion,
    scrollActive,
    selectedId,
  ]);

  useFrame((_, delta) => {
    resolveScrollPose(
      scrollProgressRef?.current?.value ?? 0,
      scrollPose,
    );
    const system = systemRef.current;
    const moon = moonRef.current;
    if (!system || !moon) return;

    const authority = beginLunarScrollAuthorityFrame(
      scrollAuthorityState,
      scrollAuthorityRef,
      mode,
      selectedId,
      scrollActive,
      scrollPose.active,
    );
    const scrollOwnsScene = authority === "scroll";
    if (scrollAuthorityState.captureRequested) {
      scrollSystemQuaternion.current.copy(system.quaternion);
      scrollMoonQuaternion.current.copy(moon.quaternion);
    }

    const orbitMode = mode === "rest" || mode === "hover";
    const continuousMotion =
      pageVisible &&
      !reducedMotion &&
      authority === "orbit" &&
      orbitMode;
    if (continuousMotion && !selectedId) {
      const speed = activeId ? 0.006 : 0.018;
      system.rotateY(Math.min(delta, 1 / 30) * speed);
    }

    const focusQuaternion = selectedId
      ? focusQuaternionById.get(selectedId)
      : null;
    if (focusQuaternion && selectionId.current !== selectedId) {
      selectionId.current = selectedId;
      selectionStartQuaternion.current.copy(system.quaternion);
    } else if (!selectedId) {
      selectionId.current = null;
    }

    const rawProgress = transitionRef.current?.value ?? 0;
    const progress = resolveTransitionProgress(
      mode,
      rawProgress,
      reducedMotion,
    );
    if (focusQuaternion && selectedId) {
      workingQuaternion.current.slerpQuaternions(
        selectionStartQuaternion.current,
        focusQuaternion,
        progress,
      );
      system.quaternion.copy(workingQuaternion.current);
    }

    if (mode === "exiting") {
      if (!exitSnapshotActive.current) {
        exitSnapshotActive.current = true;
        exitSnapshot.current.copy(system.quaternion);
      }
      const exitProgress = resolveTransitionProgress(
        "exiting",
        exitProgressRef.current?.value ?? 0,
        false,
      );
      exitTurn.current.setFromAxisAngle(Y_AXIS, -0.92 * exitProgress);
      system.quaternion
        .copy(exitSnapshot.current)
        .multiply(exitTurn.current);
    } else {
      exitSnapshotActive.current = false;
    }

    if (scrollOwnsScene) {
      system.quaternion.copy(scrollSystemQuaternion.current);
    }
    system.position.z =
      REST_SYSTEM_Z + (scrollOwnsScene ? scrollPose.asteroidDepth : 0);

    const selectedBody = selectedId ? bodyRefs.current.get(selectedId) : null;
    if (selectedBody?.group) {
      selectedBody.group.getWorldPosition(selectedWorld.current);
      focusCamera.current
        .copy(selectedWorld.current)
        .add(FOCUS_CAMERA_OFFSET);
      focusLook.current
        .copy(selectedWorld.current)
        .add(FOCUS_LOOK_OFFSET);
    } else {
      focusCamera.current.copy(REST_CAMERA);
      focusLook.current.copy(REST_TARGET);
    }

    if (scrollOwnsScene) {
      applyLunarScrollComposition(
        scrollPose,
        cameraPosition.current,
        cameraTarget.current,
        moon.position,
      );
      scrollMoonTurn.current.setFromAxisAngle(Y_AXIS, scrollPose.moonYaw);
      moon.quaternion
        .copy(scrollMoonQuaternion.current)
        .multiply(scrollMoonTurn.current);
      moon.scale.setScalar(scrollPose.moonScale);
    } else {
      cameraPosition.current.lerpVectors(
        REST_CAMERA,
        focusCamera.current,
        progress,
      );
      cameraPosition.current.y += Math.sin(progress * Math.PI) * 0.62;
      cameraPosition.current.z += Math.sin(progress * Math.PI) * 0.38;
      if (continuousMotion && !selectedId) {
        cameraPosition.current.x += MathUtils.clamp(pointer.x, -1, 1) * 0.16;
        cameraPosition.current.y += MathUtils.clamp(pointer.y, -1, 1) * 0.1;
      }
      cameraTarget.current.lerpVectors(REST_TARGET, focusLook.current, progress);
      moon.position.lerpVectors(REST_MOON, FOCUS_MOON, progress);
      moon.scale.setScalar(1);
      moon.rotation.z = mode === "exiting"
        ? (exitProgressRef.current?.value ?? 0) * -0.075
        : 0;
    }
    camera.position.copy(cameraPosition.current);
    camera.lookAt(cameraTarget.current);
    camera.updateMatrixWorld();

    const asteroidOpacity = scrollOwnsScene ? scrollPose.asteroidOpacity : 1;
    for (let index = 0; index < LUNAR_BODY_LAYOUT.length; index += 1) {
      const layout = LUNAR_BODY_LAYOUT[index];
      const body = bodyRefs.current.get(layout.id);
      if (!body?.group || !body.material) continue;
      const isSelected = layout.id === selectedId;
      const scale = isSelected
        ? MathUtils.lerp(layout.scale, FOCUS_BODY_SCALE, progress)
        : layout.scale * (1 - progress * 0.35);
      body.group.scale.setScalar(scale);
      body.group.position.set(
        layout.position[0] * (isSelected ? 1 : 1 + progress * 0.06),
        layout.position[1] * (isSelected ? 1 : 1 + progress * 0.04),
        layout.position[2] - (isSelected ? 0 : progress * 2.15),
      );
      body.material.opacity =
        (isSelected ? 1 : 1 - progress * 0.92) * asteroidOpacity;
    }

    const label = labelElementRef.current;
    const labelBody = activeId ? bodyRefs.current.get(activeId) : null;
    const labelAllowed =
      projectInteractionEnabled &&
      authority !== "scroll" &&
      orbitMode &&
      labelBody?.group;
    const trackedBody = selectedBody?.group ?? labelBody?.group;
    if (label && trackedBody) {
      trackedBody.getWorldPosition(projected.current);
      projected.current.project(camera);
      const onScreen =
        projected.current.z > -1 &&
        projected.current.z < 1 &&
        Math.abs(projected.current.x) < 1.15 &&
        Math.abs(projected.current.y) < 1.15;
      if (onScreen) {
        const x = (projected.current.x * 0.5 + 0.5) * size.width;
        const y = (-projected.current.y * 0.5 + 0.5) * size.height - 34;
        label.dataset.screenX = x.toFixed(2);
        label.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        label.style.opacity = labelAllowed ? String(asteroidOpacity) : "0";
      } else {
        delete label.dataset.screenX;
        label.style.opacity = "0";
      }
    } else if (label) {
      delete label.dataset.screenX;
      label.style.opacity = "0";
    }

    completeLunarScrollAuthorityFrame(
      scrollAuthorityState,
      scrollPose.progress,
      scrollActive,
    );
  }, -1);

  return null;
}
