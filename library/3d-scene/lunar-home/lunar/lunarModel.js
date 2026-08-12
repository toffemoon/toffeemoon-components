import { IcosahedronGeometry, MathUtils, Vector3 } from "three";

export const LUNAR_BODY_LAYOUT = [
  {
    id: "ai-story",
    position: [2.85, 0.45, -0.8],
    scale: 0.92,
    rotation: [0.42, -0.7, 0.18],
    tone: "#22292d",
  },
  {
    id: "templatefill",
    position: [-0.35, 2.15, -3.45],
    scale: 0.48,
    rotation: [-0.8, 0.25, 1.08],
    tone: "#34383a",
  },
  {
    id: "ripple",
    position: [4.15, -1.62, -4.75],
    scale: 0.57,
    rotation: [1.25, -0.25, -0.5],
    tone: "#263337",
  },
  {
    id: "toffeemoon",
    position: [0.72, -2.35, -1.95],
    scale: 0.73,
    rotation: [-0.32, 0.95, 0.64],
    tone: "#303335",
  },
  {
    id: "yorha",
    position: [-1.25, 0.92, -5.9],
    scale: 0.41,
    rotation: [0.15, 1.4, -0.92],
    tone: "#20282c",
  },
];

export function seedFromId(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hashCoordinate(seed, x, y, z, salt) {
  let hash = seed ^ salt;
  hash = Math.imul(hash ^ Math.round(x * 997), 2246822519);
  hash = Math.imul(hash ^ Math.round(y * 991), 3266489917);
  hash = Math.imul(hash ^ Math.round(z * 983), 668265263);
  hash ^= hash >>> 15;
  return (hash >>> 0) / 4294967295;
}

export function createAsteroidGeometry(id, detail = 2) {
  const geometry = new IcosahedronGeometry(1, detail);
  const positions = geometry.attributes.position;
  const point = new Vector3();
  const seed = seedFromId(id);
  const phase = (seed % 6283) / 1000;

  for (let index = 0; index < positions.count; index += 1) {
    point.fromBufferAttribute(positions, index);
    const coarse = hashCoordinate(seed, point.x, point.y, point.z, 0x9e3779b9);
    const fine = hashCoordinate(seed, point.x, point.y, point.z, 0x85ebca6b);
    const ridge = Math.sin(
      point.x * 5.7 + point.y * 3.9 - point.z * 4.6 + phase,
    );
    const radius = 0.82 + coarse * 0.25 + fine * 0.06 + ridge * 0.055;
    point.normalize().multiplyScalar(radius);
    positions.setXYZ(index, point.x, point.y, point.z);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function getFocusEuler(position) {
  const [x, y, z] = position;
  const horizontal = Math.max(Math.hypot(x, z), 0.0001);
  const azimuth = Math.atan2(x, z);
  const elevation = Math.atan2(y, horizontal);
  return [-elevation * 0.72, -azimuth + 0.34, 0];
}

export function resolveTransitionProgress(mode, rawProgress, reducedMotion) {
  if (reducedMotion) {
    return ["project-focus", "returning"].includes(mode) ? 1 : 0;
  }
  return MathUtils.smootherstep(MathUtils.clamp(rawProgress, 0, 1), 0, 1);
}
