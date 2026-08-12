import {interpolate, useCurrentFrame} from 'remotion';
import {Stage} from '../components/Stage';
import {COLORS, FONTS} from '../theme';

const START = 184.92;
const f = (t: number) => Math.round((t - START) * 30);

const phaseO = (frame: number, startSec: number, endSec: number) => {
  const FADE = 7;
  return interpolate(
    frame,
    [f(startSec), f(startSec) + FADE, f(endSec) - FADE, f(endSec)],
    [0, 1, 1, 0],
    {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'},
  );
};

const PhaseA: React.FC = () => {
  const frame = useCurrentFrame();
  const o = phaseO(frame, 184.92, 200.0);
  if (o === 0) return null;

  const headerO = interpolate(frame, [f(185.48), f(186.5)], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const warnings: Array<[string, string, number]> = [
    ['一瞬间上头', '做过激的事', 189.72],
    ['一时不甘心', '赔光最后的体面', 193.04],
    ['害怕失去', '交出边界 / 自尊 / 判断力', 196.92],
  ];

  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, padding: '0 60px', display: 'flex', flexDirection: 'column', gap: 16}}>
      <div
        style={{
          opacity: headerO,
          background: 'transparent',
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 18,
          padding: '22px 24px',
          color: COLORS.fg,
          fontFamily: FONTS.sans,
          fontSize: 30,
          fontWeight: 500,
          lineHeight: 1.35,
          textAlign: 'center',
        }}
      >
        一个 subagent 的结果
        <br />
        <span style={{color: COLORS.accent}}>不能主导整个人生</span>
      </div>

      {warnings.map(([a, b, t]) => {
        const d = f(t);
        const o2 = interpolate(frame, [d, d + 16], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
        const y = interpolate(frame, [d, d + 16], [16, 0], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
        return (
          <div
            key={a}
            style={{
              opacity: o2,
              transform: `translateY(${y}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              background: COLORS.card,
              border: `1px solid ${COLORS.danger}`,
              borderRadius: 16,
              padding: '16px 20px',
              fontFamily: FONTS.sans,
            }}
          >
            <div style={{color: COLORS.danger, fontSize: 36, fontWeight: 700, width: 40, textAlign: 'center'}}>✕</div>
            <div>
              <div style={{color: COLORS.fgDim, fontSize: 22, marginBottom: 2}}>不能因为</div>
              <div style={{color: COLORS.fg, fontSize: 26, fontWeight: 500}}>
                {a} <span style={{color: COLORS.fgDim}}>→</span> {b}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PhaseB: React.FC = () => {
  const frame = useCurrentFrame();
  const o = phaseO(frame, 200.0, 212.5);
  if (o === 0) return null;

  const headerO = interpolate(frame, [f(201.4), f(202.5)], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const facts: Array<[string, number]> = [
    ['有人会离开你', 204.76],
    ['有人不会选你', 206.12],
    ['有些关系怎么努力都走不远', 207.68],
  ];
  const turnO = interpolate(frame, [f(211.0), f(211.8)], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});

  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, padding: '0 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18}}>
      <div
        style={{
          opacity: headerO,
          textAlign: 'center',
          fontFamily: FONTS.sans,
          fontSize: 30,
          color: COLORS.fgDim,
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        生活里很多事情 · 都不会如意
      </div>

      {facts.map(([text, t], i) => {
        const d = f(t);
        const o2 = interpolate(frame, [d, d + 16], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
        const x = interpolate(frame, [d, d + 16], [-20, 0], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
        return (
          <div
            key={i}
            style={{
              opacity: o2,
              transform: `translateX(${x}px)`,
              background: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 14,
              padding: '18px 22px',
              color: COLORS.fg,
              fontFamily: FONTS.sans,
              fontSize: 30,
              borderLeft: `4px solid ${COLORS.fgDim}`,
            }}
          >
            {text}
          </div>
        );
      })}

      <div
        style={{
          opacity: turnO,
          marginTop: 16,
          textAlign: 'center',
          fontFamily: FONTS.sans,
          fontSize: 32,
          color: COLORS.accent,
          letterSpacing: 2,
          fontWeight: 600,
        }}
      >
        但 → 人要学会管理 ↓
      </div>
    </div>
  );
};

const PhaseC: React.FC = () => {
  const frame = useCurrentFrame();
  const o = phaseO(frame, 212.5, 224.0);
  if (o === 0) return null;

  const manage: Array<[string, string, number]> = [
    ['听见', '不甘心的自己', 213.88],
    ['安抚', '害怕被抛下的自己', 215.68],
    ['拦住', '想冲动挽回的自己', 218.12],
    ['保护', '快要没自尊的自己', 220.48],
  ];

  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, padding: '0 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16}}>
      <div style={{textAlign: 'center', fontSize: 24, color: COLORS.accent, letterSpacing: 4, marginBottom: 12}}>
        管理身体里的每一个自己
      </div>
      {manage.map(([verb, who, t]) => {
        const d = f(t);
        const o2 = interpolate(frame, [d, d + 16], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
        const x = interpolate(frame, [d, d + 16], [-16, 0], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
        return (
          <div
            key={verb}
            style={{
              opacity: o2,
              transform: `translateX(${x}px)`,
              display: 'flex',
              gap: 18,
              alignItems: 'center',
              background: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 16,
              padding: '18px 22px',
              fontFamily: FONTS.sans,
              borderLeft: `4px solid ${COLORS.accent}`,
            }}
          >
            <div style={{color: COLORS.accent, fontSize: 28, fontWeight: 700, width: 80}}>{verb}</div>
            <div style={{color: COLORS.fg, fontSize: 26, flex: 1}}>{who}</div>
          </div>
        );
      })}
    </div>
  );
};

const PhaseD: React.FC = () => {
  const frame = useCurrentFrame();
  const o = phaseO(frame, 223.0, 231.0);
  if (o === 0) return null;

  const growthO = interpolate(frame, [f(223.16), f(224.3)], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const becomeO = interpolate(frame, [f(224.2), f(225.3)], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const osO = interpolate(frame, [f(226.88), f(228.0)], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const osScale = interpolate(frame, [f(226.88), f(228.0)], [0.85, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});

  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 30, padding: '0 60px'}}>
      <div style={{opacity: growthO, fontFamily: FONTS.sans, fontSize: 30, color: COLORS.fgDim, letterSpacing: 3}}>
        所谓成长
      </div>
      <div
        style={{
          opacity: becomeO,
          fontFamily: FONTS.sans,
          fontSize: 32,
          color: COLORS.fg,
          textAlign: 'center',
          lineHeight: 1.5,
          maxWidth: 800,
        }}
      >
        从被某一个 subagent 控制
        <br />
        <span style={{color: COLORS.accent}}>慢慢变成自己这个主系统</span>
      </div>
      <div
        style={{
          opacity: osO,
          transform: `scale(${osScale})`,
          marginTop: 30,
          fontFamily: FONTS.mono,
          color: COLORS.accent,
          fontSize: 52,
          letterSpacing: 8,
          padding: '20px 30px',
          border: `2px solid ${COLORS.accent}`,
          borderRadius: 12,
        }}
      >
        MAIN OS · RESTORED
      </div>
    </div>
  );
};

export const S09_OSRestored: React.FC = () => {
  return (
    <Stage label="09 / 主系统重新上线">
      <div style={{position: 'relative', width: '100%', height: 1100}}>
        <PhaseA />
        <PhaseB />
        <PhaseC />
        <PhaseD />
      </div>
    </Stage>
  );
};
