import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS} from '../theme';

type Props = {
  x: number;
  y: number;
  size?: number;
  delay?: number;
  color?: string;
  pulse?: boolean;
};

export const Dot: React.FC<Props> = ({
  x,
  y,
  size = 14,
  delay = 0,
  color = COLORS.accent,
  pulse = false,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [delay, delay + 12], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const ringScale = pulse ? 1 + (Math.sin(frame * 0.15) * 0.5 + 0.5) * 0.8 : 1;
  const ringOpacity = pulse ? 0.3 - (Math.sin(frame * 0.15) * 0.5 + 0.5) * 0.25 : 0;

  return (
    <svg
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}
      viewBox="0 0 1080 1920"
    >
      {pulse && (
        <circle cx={x} cy={y} r={size * ringScale} fill="none" stroke={color} strokeWidth={2} opacity={ringOpacity * o} />
      )}
      <circle cx={x} cy={y} r={size} fill={color} opacity={o} />
    </svg>
  );
};
