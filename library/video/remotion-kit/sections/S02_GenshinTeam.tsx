import {interpolate, useCurrentFrame} from 'remotion';
import {Card} from '../components/Card';
import {Stage} from '../components/Stage';
import {COLORS, FONTS} from '../theme';

const START = 22.28;
const f = (t: number) => Math.round((t - START) * 30);

const STEPS: Array<[string, string, number]> = [
  ['①', '角色 / 武器', 32.36],
  ['②', '需求 · 深渊 / 跑图 / 活动', 36.84],
  ['③', '元素反应 / 角色定位', 41.48],
  ['④', '主C / 副C / 辅助 / 生存', 45.6],
  ['⑤', '整合 · 真正能玩的配队', 49.44],
];

const StepRow: React.FC<{n: string; label: string; delay: number; isLast: boolean}> = ({n, label, delay, isLast}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [delay, delay + 16], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const x = interpolate(frame, [delay, delay + 16], [-20, 0], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const lineH = interpolate(frame, [delay + 8, delay + 24], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  return (
    <div style={{display: 'flex', gap: 20, alignItems: 'stretch', opacity: o, transform: `translateX(${x}px)`}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: COLORS.accent,
            color: COLORS.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.sans,
            fontSize: 26,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {n}
        </div>
        {!isLast && (
          <div
            style={{
              width: 2,
              flex: 1,
              background: COLORS.accent,
              transformOrigin: 'top',
              transform: `scaleY(${lineH})`,
              marginTop: 4,
              minHeight: 28,
            }}
          />
        )}
      </div>
      <div
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 16,
          padding: '20px 24px',
          color: COLORS.fg,
          fontFamily: FONTS.sans,
          fontSize: 30,
          flex: 1,
          marginBottom: 12,
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const S02_GenshinTeam: React.FC = () => {
  return (
    <Stage label="02 / Agent 拆任务">
      <div style={{display: 'flex', flexDirection: 'column', gap: 18, width: '100%'}}>
        <Card body='"帮我配一套原神队伍"' variant="accent" delay={f(22.28)} align="center" />
        <div style={{textAlign: 'center', color: COLORS.fgDim, fontSize: 26, opacity: 0.6, margin: '4px 0'}}>
          先拆 ↓
        </div>
        {STEPS.map(([n, label, t], i) => (
          <StepRow key={n} n={n} label={label} delay={f(t)} isLast={i === STEPS.length - 1} />
        ))}
        <div style={{textAlign: 'center', color: COLORS.accent, fontSize: 30, marginTop: 8, fontFamily: FONTS.sans, opacity: 0.9}}>
          会做事 · 不是会聊天
        </div>
      </div>
    </Stage>
  );
};
