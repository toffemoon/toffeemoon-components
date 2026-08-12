import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import moonTextureUrl from "../assets/moon/moon-texture-2048.jpg";

function supportsWebgl() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

function makeRing(radius, color, opacity, rotation) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.006, 12, 180),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity }),
  );
  mesh.rotation.set(...rotation);
  return mesh;
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const disposeMaps = (material) => {
        ["map", "bumpMap", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap"].forEach((key) => {
          if (material[key]) material[key].dispose();
        });
      };
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => {
          disposeMaps(material);
          material.dispose();
        });
      } else {
        disposeMaps(child.material);
        child.material.dispose();
      }
    }
  });
}

export function SignalOrb() {
  const mountRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const reducedRef = useRef(reducedMotion);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    reducedRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    setWebgl(supportsWebgl());
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !webgl) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.2, 5.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    group.rotation.x = -0.16;
    scene.add(group);

    const moonTexture = new THREE.TextureLoader().load(moonTextureUrl);
    moonTexture.colorSpace = THREE.SRGBColorSpace;
    moonTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    moonTexture.wrapS = THREE.RepeatWrapping;
    moonTexture.wrapT = THREE.ClampToEdgeWrapping;

    const moonGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 64, 32),
      new THREE.MeshBasicMaterial({
        color: "#7DD3FC",
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(moonGlow);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.86, 96, 48),
      new THREE.MeshStandardMaterial({
        map: moonTexture,
        bumpMap: moonTexture,
        bumpScale: 0.045,
        color: "#F3EFE4",
        roughness: 0.86,
        metalness: 0.02,
      }),
    );
    group.add(core);

    group.add(makeRing(1.42, "#DDE7F2", 0.52, [Math.PI / 2, 0, 0]));
    group.add(makeRing(1.86, "#7DD3FC", 0.38, [1.18, 0.36, 0.2]));
    group.add(makeRing(2.18, "#38BDF8", 0.28, [1.68, -0.32, 0.42]));

    Array.from({ length: 18 }, (_, index) => {
      const angle = (index / 18) * Math.PI * 2;
      const radius = 1.45 + (index % 3) * 0.34;
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(index % 5 === 0 ? 0.048 : 0.031, 14, 14),
        new THREE.MeshBasicMaterial({
          color: index % 7 === 0 ? "#F8FAFC" : index % 4 === 0 ? "#C4B5FD" : index % 5 === 0 ? "#7DD3FC" : "#DDE7F2",
          transparent: true,
          opacity: index % 7 === 0 ? 0.9 : 0.74,
        }),
      );
      node.position.set(Math.cos(angle) * radius, Math.sin(index * 1.7) * 0.18, Math.sin(angle) * radius);
      group.add(node);
      return node;
    });

    scene.add(new THREE.AmbientLight("#7C8AA5", 0.58));
    const key = new THREE.DirectionalLight("#FFF7E6", 3.2);
    key.position.set(-3.4, 2.8, 4.2);
    scene.add(key);
    const fill = new THREE.PointLight("#38BDF8", 3.8, 8);
    fill.position.set(3.2, -1.4, 2.2);
    scene.add(fill);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const onResize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    mount.addEventListener("pointermove", onPointerMove);
    window.addEventListener("resize", onResize);

    let rafId = 0;
    const start = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      if (!reducedRef.current) {
        group.rotation.y += (elapsed * 0.08 + pointer.x * 0.18 - group.rotation.y) * 0.045;
        group.rotation.x += (-0.16 + pointer.y * 0.1 - group.rotation.x) * 0.045;
        moonGlow.rotation.copy(core.rotation);
        core.rotation.y = elapsed * 0.075;
        core.position.y = Math.sin(elapsed * 0.9) * 0.035;
        moonGlow.position.y = core.position.y;
      }
      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.cancelAnimationFrame(rafId);
      mount.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      disposeObject(scene);
      renderer.domElement.remove();
    };
  }, [webgl]);

  if (!webgl) {
    return (
      <div className="signal-fallback" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    );
  }

  return <div className="signal-canvas-host" ref={mountRef} aria-hidden="true" />;
}
