import {interpolate, useCurrentFrame} from 'remotion';
import {Stage} from '../components/Stage';
import {COLORS, FONTS} from '../theme';

const START = 0.0;
const f = (t: number) => Math.round((t - START) * 30);

const Bubble: React.FC<{text: string; delay: number; side: 'L' | 'R'}> = ({text, delay, side}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [delay, delay + 14], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const y = interpolate(frame, [delay, delay + 14], [12, 0], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const isL = side === 'L';
  return (
    <div
      style={{
        opacity: o,
        transform: `translateY(${y}px)`,
        alignSelf: isL ? 'flex-start' : 'flex-end',
        background: isL ? COLORS.card : COLORS.accentSoft,
        color: COLORS.fg,
        padding: '18px 24px',
        borderRadius: 24,
        maxWidth: '75%',
        fontFamily: FONTS.sans,
        fontSize: 32,
        borderTopLeftRadius: isL ? 6 : 24,
        borderTopRightRadius: isL ? 24 : 6,
      }}
    >
      {text}
    </div>
  );
};

export const S01_WhatIsAgent: React.FC = () => {
  const frame = useCurrentFrame();
  const agentO = interpolate(frame, [f(10.76), f(11.6)], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  return (
    <Stage label="01 / 什么是 Agent">
      <div style={{display: 'flex', flexDirection: 'column', gap: 40, width: '100%'}}>
        <div
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 24,
            padding: 28,
          }}
        >
          <div style={{color: COLORS.fgDim, fontSize: 24, letterSpacing: 3, marginBottom: 18}}>过去的 AI · 聊天</div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
            <Bubble text="帮我写文案" delay={f(1.0)} side="L" />
            <Bubble text="写好了" delay={f(2.2)} side="R" />
            <Bubble text="帮我翻译" delay={f(3.4)} side="L" />
            <Bubble text="翻好了" delay={f(4.6)} side="R" />
          </div>
        </div>

        <div style={{textAlign: 'center', color: COLORS.fgDim, fontSize: 38}}>↓ 但 agent 不一样 ↓</div>

        <div
          style={{
            background: COLORS.accent,
            color: COLORS.bg,
            borderRadius: 24,
            padding: 28,
            position: 'relative',
            opacity: agentO,
          }}
        >
          <div style={{fontSize: 24, letterSpacing: 3, opacity: 0.7, marginBottom: 18}}>AGENT · 系统</div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative'}}>
            {['理解目标', '拆任务', '自己执行'].map((s) => (
              <div key={s} style={{fontSize: 32, fontWeight: 600, padding: '12px 16px', background: 'rgba(0,0,0,0.15)', borderRadius: 14}}>
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Stage>
  );
};
