import {interpolate, useCurrentFrame} from 'remotion';
import {Stage} from '../components/Stage';
import {COLORS, FONTS} from '../theme';

const START = 117.0;
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

const Phase1: React.FC = () => {
  const frame = useCurrentFrame();
  const o = phaseO(frame, 117.0, 132.28);
  if (o === 0) return null;

  const figO = interpolate(frame, [0, 24], [0, 0.7], {extrapolateRight: 'clamp'});
  const heartbreak = interpolate(frame, [f(120.32), f(121.2)], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});

  const advices: Array<[string, number]> = [
    ['保留最后的体面', 124.76],
    ['接受她的离开', 127.68],
    ['别纠缠 · 别失控', 129.0],
    ['别难看', 130.72],
  ];

  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <svg viewBox="0 0 1080 1400" style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}}>
        <g opacity={figO}>
          <circle cx={260} cy={360} r={56} fill={COLORS.fg} />
          <rect x={210} y={416} width={100} height={180} rx={28} fill={COLORS.fg} />
          {[0, 1, 2, 3, 4].map((i) => {
            const py = 440 + i * 32;
            const pulse = 0.5 + Math.sin(frame * 0.15 + i) * 0.4;
            return <circle key={i} cx={260} cy={py} r={6} fill={COLORS.accent} opacity={pulse} />;
          })}
        </g>
        <text x={260} y={650} textAnchor="middle" fill={COLORS.fgDim} fontFamily={FONTS.sans} fontSize="24" opacity={figO}>
          身体里 · 不同的自己
        </text>
      </svg>

      <div
        style={{
          position: 'absolute',
          left: 360,
          top: 320,
          opacity: heartbreak,
          background: COLORS.danger,
          color: COLORS.fg,
          padding: '14px 24px',
          borderRadius: 14,
          fontFamily: FONTS.sans,
          fontSize: 30,
          fontWeight: 600,
        }}
      >
        分手了
      </div>

      <div
        style={{
          position: 'absolute',
          right: 40,
          top: 460,
          width: 460,
          opacity: interpolate(frame, [f(123.6), f(124.6)], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'}),
        }}
      >
        <div style={{fontSize: 22, color: COLORS.accentSoft, marginBottom: 14, letterSpacing: 3}}>理性建议</div>
        {advices.map(([text, at], i) => {
          const d = f(at);
          const o2 = interpolate(frame, [d, d + 16], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
          const x = interpolate(frame, [d, d + 16], [-20, 0], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
          return (
            <div
              key={i}
              style={{
                opacity: o2,
                transform: `translateX(${x}px)`,
                fontSize: 26,
                color: COLORS.fg,
                marginBottom: 14,
                borderLeft: `3px solid ${COLORS.accentSoft}`,
                paddingLeft: 16,
                fontFamily: FONTS.sans,
              }}
            >
              ✓ {text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Phase2: React.FC = () => {
  const frame = useCurrentFrame();
  const o = phaseO(frame, 132.28, 148.12);
  if (o === 0) return null;

  const voices: Array<{tag: string; line: string; at: number}> = [
    {tag: '感性', line: '我不甘心', at: 134.88},
    {tag: '妄念', line: '也许再多说一句, 她就会回头', at: 138.4},
    {tag: '回忆', line: '那些好的瞬间, 一遍遍翻出来', at: 140.92},
  ];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: o,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 20,
        padding: '0 60px',
      }}
    >
      <div style={{textAlign: 'center', fontSize: 24, color: COLORS.danger, letterSpacing: 4, marginBottom: 10}}>
        ✕ subagent 反驳 ✕
      </div>
      {voices.map((v) => {
        const d = f(v.at);
        const o2 = interpolate(frame, [d, d + 16], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
        const y = interpolate(frame, [d, d + 16], [24, 0], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
        return (
          <div
            key={v.tag}
            style={{
              opacity: o2,
              transform: `translateY(${y}px)`,
              background: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 18,
              padding: '20px 24px',
              fontFamily: FONTS.sans,
            }}
          >
            <div style={{fontSize: 22, color: COLORS.accent, marginBottom: 6, letterSpacing: 2}}>
              subagent · {v.tag}
            </div>
            <div style={{fontSize: 34, color: COLORS.fg, fontWeight: 500, lineHeight: 1.3}}>{v.line}</div>
          </div>
        );
      })}
    </div>
  );
};

const Phase3: React.FC = () => {
  const frame = useCurrentFrame();
  const o = phaseO(frame, 148.12, 162.64);
  if (o === 0) return null;

  const msgs: Array<{text: string; at: number; sub?: string}> = [
    {text: '在吃饭吗?', at: 152.68},
    {text: '最近好不好?', at: 154.12},
    {text: '我们做朋友吧', at: 155.52, sub: '(假装)'},
  ];

  const headerO = interpolate(frame, [f(148.12), f(149)], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const truthO = interpolate(frame, [f(159.72), f(160.5)], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const truthS = interpolate(frame, [f(159.72), f(160.5)], [0.85, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});

  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, padding: '20px 50px'}}>
      <div
        style={{
          textAlign: 'center',
          fontSize: 26,
          color: COLORS.danger,
          letterSpacing: 3,
          marginBottom: 16,
          opacity: headerO,
        }}
      >
        变成自己都看不起的样子
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px dashed ${COLORS.cardBorder}`,
          borderRadius: 20,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{color: COLORS.fgDim, fontSize: 22, letterSpacing: 2}}>chat · 给她发的消息</div>
        {msgs.map((m) => {
          const d = f(m.at);
          const o2 = interpolate(frame, [d, d + 14], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
          return (
            <div key={m.text} style={{opacity: o2, alignSelf: 'flex-end', maxWidth: '78%'}}>
              <div
                style={{
                  background: COLORS.accentSoft,
                  color: COLORS.fg,
                  padding: '14px 22px',
                  borderRadius: 22,
                  borderTopRightRadius: 6,
                  fontFamily: FONTS.sans,
                  fontSize: 30,
                }}
              >
                {m.text}
              </div>
              {m.sub && (
                <div style={{textAlign: 'right', color: COLORS.fgDim, fontSize: 22, marginTop: 4}}>{m.sub}</div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 28,
          textAlign: 'center',
          opacity: truthO,
          transform: `scale(${truthS})`,
          color: COLORS.danger,
          fontSize: 32,
          fontFamily: FONTS.sans,
          fontWeight: 600,
          lineHeight: 1.35,
          padding: '20px 24px',
          border: `2px solid ${COLORS.danger}`,
          borderRadius: 18,
        }}
      >
        每句话背后都藏着:
        <br />
        "你能不能不要真的离开我"
      </div>
    </div>
  );
};

const Phase4: React.FC = () => {
  const frame = useCurrentFrame();
  const o = phaseO(frame, 162.64, 174.88);
  if (o === 0) return null;

  const cardO = interpolate(frame, [f(162.64), f(163.6)], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const line1O = interpolate(frame, [f(165.72), f(166.5)], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  const line2O = interpolate(frame, [f(166.68), f(167.5)], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: o,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 32,
        padding: '0 60px',
      }}
    >
      <div style={{textAlign: 'center', fontSize: 28, color: COLORS.accent, letterSpacing: 4, marginBottom: 10}}>
        但这时候 ↓
      </div>
      <div
        style={{
          opacity: cardO,
          background: COLORS.accent,
          color: COLORS.bg,
          borderRadius: 24,
          padding: '32px 28px',
          fontFamily: FONTS.sans,
        }}
      >
        <div style={{fontSize: 22, letterSpacing: 3, opacity: 0.7, marginBottom: 18}}>subagent · 自尊</div>
        <div style={{fontSize: 40, fontWeight: 600, lineHeight: 1.4}}>
          <div style={{opacity: line1O}}>别为了被爱</div>
          <div style={{opacity: line2O}}>把自己放得太低</div>
        </div>
      </div>
    </div>
  );
};

export const S07_BreakupSubagents: React.FC = () => {
  return (
    <Stage label="07 / 当她说要分手">
      <div style={{position: 'relative', width: '100%', height: 1100}}>
        <Phase1 />
        <Phase2 />
        <Phase3 />
        <Phase4 />
      </div>
    </Stage>
  );
};
