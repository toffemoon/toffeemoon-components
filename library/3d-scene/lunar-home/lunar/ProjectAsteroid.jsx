import { forwardRef, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";
import { createAsteroidGeometry } from "./lunarModel.js";
import { shouldAnimateLunarChild } from "./lunarScrollModel.js";

const DISABLED_PROJECT_RAYCAST = () => null;

export function resolveProjectRaycast(projectInteractionEnabled) {
  return projectInteractionEnabled
    ? Mesh.prototype.raycast
    : DISABLED_PROJECT_RAYCAST;
}

export const ProjectAsteroid = forwardRef(function ProjectAsteroid(
  {
    item,
    layout,
    active,
    selected,
    discoveryCue,
    motionAllowed,
    mode,
    scrollAuthorityRef,
    projectInteractionEnabled = true,
    registerBody,
    onHover,
    onSelect,
  },
  forwardedRef,
) {
  const groupRef = useRef(null);
  const visualRef = useRef(null);
  const materialRef = useRef(null);
  const geometry = useMemo(() => createAsteroidGeometry(item.id), [item.id]);
  const projectRaycast = resolveProjectRaycast(projectInteractionEnabled);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    if (!groupRef.current) return undefined;
    const body = {
      group: groupRef.current,
      material: materialRef.current,
      visual: visualRef.current,
    };
    registerBody(item.id, body);
    return () => registerBody(item.id, null);
  }, [item.id, registerBody]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      const cueIntensity = motionAllowed
        ? 0.055 + (Math.sin(state.clock.elapsedTime * 2.1) + 1) * 0.035
        : 0.065;
      materialRef.current.emissiveIntensity = selected
        ? 0.22
        : active
          ? 0.16
          : discoveryCue
            ? cueIntensity
            : 0.025;
    }
    if (
      !visualRef.current ||
      !shouldAnimateLunarChild(
        motionAllowed,
        scrollAuthorityRef?.current === true,
      ) ||
      mode === "project-focus"
    ) {
      return;
    }
    const pace = selected ? 0.045 : active ? 0.11 : 0.075;
    visualRef.current.rotation.x += Math.min(delta, 1 / 30) * pace;
    visualRef.current.rotation.y += Math.min(delta, 1 / 30) * pace * 1.35;
    if (active && !selected) {
      visualRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 0.7 + layout.scale) * 0.025;
    }
  });

  const setRefs = (node) => {
    groupRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const handlePointerOver = (event) => {
    if (!projectInteractionEnabled) return;
    event.stopPropagation();
    onHover(item.id);
  };

  const handlePointerOut = (event) => {
    if (!projectInteractionEnabled) return;
    event.stopPropagation();
    onHover(null);
  };

  const handleClick = (event) => {
    if (!projectInteractionEnabled) return;
    event.stopPropagation();
    onSelect(item.id);
  };

  return (
    <group
      ref={setRefs}
      position={layout.position}
      rotation={layout.rotation}
      scale={layout.scale}
      onPointerOver={projectInteractionEnabled ? handlePointerOver : undefined}
      onPointerOut={projectInteractionEnabled ? handlePointerOut : undefined}
      onClick={projectInteractionEnabled ? handleClick : undefined}
    >
      <mesh
        ref={visualRef}
        geometry={geometry}
        castShadow={false}
        receiveShadow={false}
        raycast={projectRaycast}
      >
        <meshStandardMaterial
          ref={materialRef}
          color={layout.tone}
          roughness={0.9}
          metalness={0.14}
          emissive={active || selected || discoveryCue ? "#6b8f92" : "#07131c"}
          emissiveIntensity={
            selected ? 0.22 : active ? 0.16 : discoveryCue ? 0.065 : 0.025
          }
          flatShading
          transparent
          opacity={1}
        />
      </mesh>

      <mesh geometry={geometry} scale={1.62} raycast={projectRaycast}>
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          colorWrite={false}
        />
      </mesh>
    </group>
  );
});
