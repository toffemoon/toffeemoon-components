import { forwardRef, useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  LinearFilter,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
  TextureLoader,
} from "three";
import moonUrl from "../../assets/moon/moon-texture-2048.jpg";
import { shouldAnimateLunarChild } from "./lunarScrollModel.js";

export const MoonBody = forwardRef(function MoonBody(
  { motionAllowed, mode, scrollAuthorityRef },
  forwardedRef,
) {
  const meshRef = useRef(null);
  const texture = useLoader(TextureLoader, moonUrl);
  const { gl } = useThree();

  const maxAnisotropy = useMemo(
    () => Math.min(gl.capabilities.getMaxAnisotropy(), 8),
    [gl],
  );

  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = maxAnisotropy;
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.needsUpdate = true;
  }, [maxAnisotropy, texture]);

  useFrame((_, delta) => {
    if (
      !meshRef.current ||
      !shouldAnimateLunarChild(
        motionAllowed,
        scrollAuthorityRef?.current === true,
      ) ||
      (mode !== "rest" && mode !== "hover")
    ) {
      return;
    }
    meshRef.current.rotation.y += Math.min(delta, 1 / 30) * 0.026;
  });

  return (
    <group ref={forwardedRef} position={[-3.55, -0.25, -1.1]}>
      <mesh ref={meshRef} rotation={[0.03, -1.42, -0.1]}>
        <sphereGeometry args={[4.15, 96, 64]} />
        <meshStandardMaterial
          map={texture}
          bumpMap={texture}
          bumpScale={0.085}
          color="#aeb9b8"
          roughness={0.78}
          metalness={0.06}
        />
      </mesh>
    </group>
  );
});
