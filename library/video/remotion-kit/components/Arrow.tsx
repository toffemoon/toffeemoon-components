import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS} from '../theme';

type Props = {
  from: [number, number];
  to: [number, number];
  delay?: number;
  duration?: number;
  color?: string;
  width?: number;
  arrowhead?: boolean;
  dashed?: boolean;
};

export const Arrow: React.FC<Props> = ({
  from,
  to,
  delay = 0,
  duration = 18,
  color = COLORS.fgDim,
  width = 2,
  arrowhead = true,
  dashed = false,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const [x1, y1] = from;
  const [x2, y2] = to;
  const cx = x1 + (x2 - x1) * progress;
  const cy = y1 + (y2 - y1) * progress;

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 16;
  const hx1 = cx - headLen * Math.cos(angle - Math.PI / 6);
  const hy1 = cy - headLen * Math.sin(angle - Math.PI / 6);
  const hx2 = cx - headLen * Math.cos(angle + Math.PI / 6);
  const hy2 = cy - headLen * Math.sin(angle + Math.PI / 6);

  return (
    <svg
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}
      viewBox="0 0 1080 1920"
      preserveAspectRatio="xMidYMid meet"
    >
      <line
        x1={x1}
        y1={y1}
        x2={cx}
        y2={cy}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? '8 8' : undefined}
        strokeLinecap="round"
      />
      {arrowhead && progress > 0.05 && (
        <polyline
          points={`${hx1},${hy1} ${cx},${cy} ${hx2},${hy2}`}
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
    </svg>
  );
};
