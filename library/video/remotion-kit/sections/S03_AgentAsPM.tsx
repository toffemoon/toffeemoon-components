import {interpolate, useCurrentFrame} from 'remotion';
import {Stage} from '../components/Stage';
import {Arrow} from '../components/Arrow';
import {COLORS, FONTS} from '../theme';

const START = 57.0;
const f = (t: number) => Math.round((t - START) * 30);

export const S03_AgentAsPM: React.FC = () => {
  const frame = useCurrentFrame();

  const NodeBox: React.FC<{label: string; delay: number; bg: string; fg: string; w?: number}> = ({label, delay, bg, fg, w}) => {
    const o = interpolate(frame, [delay, delay + 14], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
    const s = interpolate(frame, [delay, delay + 14], [0.9, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
    return (
      <div
        style={{
          opacity: o,
          transform: `scale(${s})`,
          background: bg,
          color: fg,
          borderRadius: 20,
          padding: '20px 28px',
          fontFamily: FONTS.sans,
          fontSize: 32,
          fontWeight: 600,
          textAlign: 'center',
          width: w,
          border: bg === 'transparent' ? `1px solid ${COLORS.cardBorder}` : 'none',
        }}
      >
        {label}
      </div>
    );
  };

  return (
    <Stage label="03 / Agent ≈ 项目负责人">
      <div style={{position: 'relative', width: '100%', height: 700, marginTop: 40}}>
        <Arrow from={[540, 220]} to={[300, 480]} delay={f(60.3)} color={COLORS.accent} />
        <Arrow from={[540, 220]} to={[780, 480]} delay={f(60.6)} color={COLORS.accent} />

        <div style={{position: 'absolute', left: '50%', top: 100, transform: 'translateX(-50%)'}}>
          <NodeBox label="Agent · 项目负责人" delay={f(57.04)} bg={COLORS.accent} fg={COLORS.bg} w={420} />
        </div>

        <div style={{position: 'absolute', left: 60, top: 460, width: 380}}>
          <NodeBox label="拆开复杂任务" delay={f(60.08)} bg={COLORS.card} fg={COLORS.fg} />
        </div>
        <div style={{position: 'absolute', right: 60, top: 460, width: 380}}>
          <NodeBox label="一步步推进" delay={f(61.5)} bg={COLORS.card} fg={COLORS.fg} />
        </div>
      </div>
    </Stage>
  );
};
