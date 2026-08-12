import {interpolate, useCurrentFrame} from 'remotion';
import {Stage} from '../components/Stage';
import {COLORS, FONTS} from '../theme';

const START = 63.92;
const f = (t: number) => Math.round((t - START) * 30);

type Task = {label: string; pos: [number, number]};
const TASKS: Task[] = [
  {label: '角色机制', pos: [40, 340]},
  {label: '元素反应', pos: [500, 340]},
  {label: '输出循环', pos: [40, 460]},
  {label: '充能', pos: [500, 460]},
  {label: '配装', pos: [40, 580]},
  {label: '蒸发反应', pos: [500, 580]},
  {label: '圣遗物词条', pos: [240, 700]},
];

const HIGHLIGHTS: Record<number, [number, number]> = {
  5: [77.92, 80.76],
  6: [80.76, 83.28],
};

export const S04_Overload: React.FC = () => {
  const frame = useCurrentFrame();
  const tNow = frame / 30 + START;
  const agentO = interpolate(frame, [0, 24], [0, 1], {extrapolateRight: 'clamp'});
  const shake = tNow > 75.32 && tNow < 84.5 ? Math.sin(frame * 0.55) * 8 : 0;

  const xO = interpolate(frame, [f(84.96), f(85.6)], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const subO = interpolate(frame, [f(87.6), f(88.3)], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const fadeOldOut = interpolate(frame, [f(84.5), f(85.6)], [1, 0.15], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});

  return (
    <Stage label="04 / 一个 agent 自己做 · 会乱">
      <div style={{position: 'relative', width: '100%', height: 1100}}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 100,
            transform: 'translateX(-50%)',
            opacity: agentO * fadeOldOut,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: COLORS.accent,
            color: COLORS.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.sans,
            fontSize: 38,
            fontWeight: 700,
            boxShadow: shake !== 0 ? '0 0 40px rgba(196,90,74,0.4)' : 'none',
          }}
        >
          Agent
        </div>

        {TASKS.map((task, i) => {
          const delay = f(68.36 + i * 0.7);
          const o = interpolate(frame, [delay, delay + 14], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
          const range = HIGHLIGHTS[i];
          let hi = 0;
          if (range) {
            const [s, e] = range;
            hi = interpolate(
              frame,
              [f(s), f(s) + 4, f(e) - 4, f(e)],
              [0, 1, 1, 0],
              {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'},
            );
          }
          const dx = (i % 2 === 0 ? 1 : -1) * shake;

          return (
            <div
              key={task.label}
              style={{
                position: 'absolute',
                left: task.pos[0],
                top: task.pos[1],
                width: 360,
                opacity: o * fadeOldOut,
                transform: `translateX(${dx}px)`,
                background: hi > 0.1 ? COLORS.danger : COLORS.card,
                border: `1px solid ${hi > 0.1 ? COLORS.danger : COLORS.cardBorder}`,
                borderRadius: 14,
                padding: '12px 16px',
                color: hi > 0.1 ? COLORS.fg : COLORS.fgDim,
                fontFamily: FONTS.sans,
                fontSize: 26,
                textAlign: 'center',
                boxShadow: hi > 0.1 ? `0 0 ${20 * hi}px rgba(196,90,74,${0.6 * hi})` : 'none',
              }}
            >
              {task.label}
            </div>
          );
        })}

        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 880,
            transform: 'translateX(-50%)',
            opacity: xO,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            fontFamily: FONTS.sans,
          }}
        >
          <div
            style={{
              color: COLORS.danger,
              fontSize: 100,
              fontWeight: 700,
              lineHeight: 1,
              transform: `scale(${interpolate(frame, [f(84.96), f(85.6)], [0.5, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'})})`,
            }}
          >
            ✕
          </div>
          <div style={{color: COLORS.danger, fontSize: 40, fontWeight: 600}}>队伍转不起来</div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 990,
            transform: 'translateX(-50%)',
            opacity: subO,
            background: COLORS.accent,
            color: COLORS.bg,
            padding: '14px 30px',
            borderRadius: 999,
            fontFamily: FONTS.sans,
            fontSize: 30,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          所以 → 需要 subagent
        </div>
      </div>
    </Stage>
  );
};
