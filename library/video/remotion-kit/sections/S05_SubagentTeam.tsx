import {interpolate, useCurrentFrame} from 'remotion';
import {Stage} from '../components/Stage';
import {Card} from '../components/Card';
import {COLORS, FONTS} from '../theme';

const START = 89.88;
const f = (t: number) => Math.round((t - START) * 30);

type Role = {tag: string; desc: string; at: number};
const ROLES: Role[] = [
  {tag: '调研', desc: '了解情况', at: 90.5},
  {tag: '规划', desc: '定步骤', at: 92.0},
  {tag: '执行', desc: '动手做', at: 93.6},
  {tag: '沟通', desc: '协作', at: 95.0},
  {tag: '检查', desc: '验收', at: 96.5},
];

export const S05_SubagentTeam: React.FC = () => {
  const frame = useCurrentFrame();
  const lineProgress = interpolate(frame, [f(90.0), f(97.0)], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const summaryO = interpolate(frame, [f(105.36), f(106.0)], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  return (
    <Stage label="05 / subagent · 团队成员">
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, width: '100%'}}>
        <Card body="Agent" variant="accent" delay={f(89.88)} align="center" width={320} />

        <svg width="100%" height="120" viewBox="0 0 920 120" style={{marginTop: 8}}>
          <line x1="460" y1="0" x2="460" y2="40" stroke={COLORS.accent} strokeWidth="2.5" strokeDasharray="920" strokeDashoffset={920 * (1 - lineProgress)} />
          <line x1="60" y1="40" x2={60 + (860 - 60) * lineProgress} y2="40" stroke={COLORS.accent} strokeWidth="2.5" />
          {[60, 260, 460, 660, 860].map((x, i) => {
            const localP = interpolate(lineProgress, [0.2 + i * 0.15, 0.4 + i * 0.15], [0, 1], {
              extrapolateRight: 'clamp',
              extrapolateLeft: 'clamp',
            });
            return <line key={i} x1={x} y1="40" x2={x} y2={40 + 70 * localP} stroke={COLORS.accent} strokeWidth="2.5" />;
          })}
        </svg>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, width: '100%', marginTop: -10}}>
          {ROLES.map((r) => {
            const delay = f(r.at);
            const o = interpolate(frame, [delay, delay + 16], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
            const y = interpolate(frame, [delay, delay + 16], [16, 0], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
            return (
              <div
                key={r.tag}
                style={{
                  opacity: o,
                  transform: `translateY(${y}px)`,
                  background: COLORS.card,
                  border: `1px solid ${COLORS.cardBorder}`,
                  borderRadius: 14,
                  padding: '16px 8px',
                  fontFamily: FONTS.sans,
                  textAlign: 'center',
                }}
              >
                <div style={{fontSize: 28, fontWeight: 700, color: COLORS.accent, marginBottom: 6}}>{r.tag}</div>
                <div style={{fontSize: 18, color: COLORS.fgDim, lineHeight: 1.25}}>{r.desc}</div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            opacity: summaryO,
            marginTop: 60,
            textAlign: 'center',
            color: COLORS.fg,
            fontFamily: FONTS.sans,
            fontSize: 34,
            fontWeight: 500,
            background: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 16,
            padding: '20px 24px',
          }}
        >
          不是单人脑袋 · 是小团队
        </div>
      </div>
    </Stage>
  );
};
