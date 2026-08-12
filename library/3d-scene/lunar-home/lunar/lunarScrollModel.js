export const LUNAR_SCROLL_RANGES = Object.freeze({
  active: [0.02, 1],
  center: [0.08, 0.28],
  who: [0.28, 0.42],
  how: [0.42, 0.56],
  values: [0.56, 0.70],
  horizon: [0.70, 1],
  asteroidFade: [0.02, 0.18],
});

export const clamp01 = (value) =>
  Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export function remapProgress(value, start, end) {
  const t = clamp01((clamp01(value) - start) / (end - start));
  return t * t * (3 - 2 * t);
}

export function resolveScrollBeat(progress) {
  const value = clamp01(progress);
  if (value < 0.28) return "orbit";
  if (value < 0.42) return "who";
  if (value < 0.56) return "how";
  if (value < 0.70) return "values";
  return "horizon";
}

export function shouldAnimateLunarChild(
  motionAllowed,
  scrollAuthorityActive,
) {
  return Boolean(motionAllowed) && !scrollAuthorityActive;
}

export function resolveScrollPose(progress, output = {}) {
  const value = clamp01(progress);
  const centerProgress = remapProgress(value, 0.08, 0.28);
  const storyProgress = remapProgress(value, 0.28, 0.70);
  const horizonProgress = remapProgress(value, 0.70, 1);
  const asteroidRetreat = remapProgress(value, 0.02, 0.18);
  output.progress = value;
  output.centerProgress = centerProgress;
  output.storyProgress = storyProgress;
  output.horizonProgress = horizonProgress;
  output.asteroidOpacity = 1 - asteroidRetreat;
  output.asteroidDepth = asteroidRetreat * -4.5;
  output.moonYaw =
    centerProgress * 1.396 + storyProgress * 0.42 + horizonProgress * 0.17;
  output.moonScale = 1 + horizonProgress * 0.18;
  output.active = value > 0.02;
  return output;
}
