import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

const palette = ["#f1ddbd", "#d88c65", "#f4efe3", "#cdd3bf", "#f7efe2"];

function roundedRectShape(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  return shape;
}

function makeCard({ width, height, radius, color, depth = 0.04 }) {
  const geometry = new THREE.ExtrudeGeometry(roundedRectShape(width, height, radius), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.018,
    bevelSegments: 8,
  });
  geometry.center();

  return new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.76,
      metalness: 0.02,
    })
  );
}

function makeLabel(text, color = "#2a211b") {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 180;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.font = "600 54px Cormorant Garamond, Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, 0.82),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true })
  );
  mesh.position.z = 0.05;
  return mesh;
}

export function FolderScene({ activeIndex = 0 }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0.28, 7.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    group.rotation.x = -0.08;
    group.rotation.y = -0.36;
    group.rotation.z = -0.015;
    scene.add(group);

    scene.add(new THREE.HemisphereLight("#fff7ea", "#b88f67", 2.4));

    const key = new THREE.DirectionalLight("#ffffff", 2.1);
    key.position.set(-3, 4, 5);
    key.castShadow = true;
    scene.add(key);

    const fill = new THREE.PointLight("#c1744f", 12, 8);
    fill.position.set(2.8, -1.8, 2.2);
    scene.add(fill);

    const back = makeCard({ width: 4.8, height: 2.8, radius: 0.16, color: "#b98d4f", depth: 0.16 });
    back.position.set(0.3, -0.16, -0.55);
    back.rotation.x = -0.04;
    back.castShadow = true;
    back.receiveShadow = true;
    group.add(back);

    const cards = [];
    ["Profile", "Work", "Writing", "System"].forEach((label, index) => {
      const card = makeCard({
        width: 4.35 - index * 0.12,
        height: 2.36,
        radius: 0.14,
        color: palette[index + 1],
        depth: 0.055,
      });
      card.position.set(-0.12 + index * 0.18, 0.1 + index * 0.32, -0.3 + index * 0.28);
      card.rotation.x = -0.1 + index * 0.018;
      card.rotation.z = -0.035 + index * 0.024;
      card.castShadow = true;
      card.receiveShadow = true;

      const labelMesh = makeLabel(label, index === 1 ? "#3a2117" : "#2f261e");
      labelMesh.position.set(-0.35, 0.52, 0.06);
      card.add(labelMesh);

      const pin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.05, 32),
        new THREE.MeshStandardMaterial({
          color: index === 2 ? "#6b7358" : "#a76847",
          roughness: 0.45,
          metalness: 0.15,
        })
      );
      pin.rotation.x = Math.PI / 2;
      pin.position.set(-1.82, 0.82, 0.09);
      card.add(pin);

      cards.push(card);
      group.add(card);
    });

    const front = makeCard({ width: 5.05, height: 2.2, radius: 0.18, color: "#e8b45d", depth: 0.18 });
    front.position.set(0, -1.08, 0.92);
    front.rotation.x = -0.16;
    front.castShadow = true;
    front.receiveShadow = true;
    const frontLabel = makeLabel("TOFFEEMOON", "#8f4d2f");
    frontLabel.position.set(0.06, 0.04, 0.12);
    front.add(frontLabel);
    group.add(front);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.ShadowMaterial({ opacity: 0.16 }));
    floor.position.set(0, -2.28, 0);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    sceneRef.current = { group, cards, renderer, camera, scene };

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const onResize = () => {
      const nextWidth = mount.clientWidth;
      const nextHeight = mount.clientHeight;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    };

    mount.addEventListener("pointermove", onPointerMove);
    window.addEventListener("resize", onResize);

    let rafId = 0;
    const tick = () => {
      group.rotation.y += (-0.36 + pointer.x * 0.08 - group.rotation.y) * 0.045;
      group.rotation.x += (-0.08 - pointer.y * 0.045 - group.rotation.x) * 0.045;
      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.cancelAnimationFrame(rafId);
      mount.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const refs = sceneRef.current;
    if (!refs) return;

    refs.cards.forEach((card, index) => {
      const isActive = index === activeIndex;
      gsap.to(card.position, {
        y: 0.1 + index * 0.32 + (isActive ? 0.54 : 0),
        z: -0.3 + index * 0.28 + (isActive ? 0.88 : 0),
        x: -0.12 + index * 0.18 + (isActive ? -0.12 : 0),
        duration: 0.72,
        ease: "power3.out",
      });
      gsap.to(card.rotation, {
        z: -0.035 + index * 0.024 + (isActive ? -0.035 : 0),
        duration: 0.72,
        ease: "power3.out",
      });
    });
  }, [activeIndex]);

  return <div className="folder-scene" ref={mountRef} aria-hidden="true" />;
}
