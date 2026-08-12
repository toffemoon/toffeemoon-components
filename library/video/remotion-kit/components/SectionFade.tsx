import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

export const SectionFade: React.FC<{duration: number; children: React.ReactNode}> = ({duration, children}) => {
  const frame = useCurrentFrame();
  const FADE = 7;
  const o = interpolate(
    frame,
    [0, FADE, duration - FADE, duration],
    [0, 1, 1, 0],
    {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'},
  );
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};
