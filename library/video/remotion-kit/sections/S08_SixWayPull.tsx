import {interpolate, useCurrentFrame} from 'remotion';
import {Stage} from '../components/Stage';
import {COLORS, FONTS} from '../theme';

const START = 174.88;
const f = (t: number) => Math.round((t - START) * 30);

type Pull = {tag: string; line: string; at: number; angleDeg: number};
const PULLS: Pull[] = [
  {tag: '理性', line: '叫你走', at: 174.88, angleDeg: 210},
  {tag: '感性', line: '叫你留', at: 176.0, angleDeg: 330},
  {tag: '自尊', line: '别回头', at: 177.12, angleDeg: 180},
  {tag: '欲望', line: '再靠近一点', at: 178.6, angleDeg: 0},
  {tag: '安全感', line: '会再次受伤', at: 180.28, angleDeg: 150},
  {tag: '孤独', line: '受伤好过一个人', at: 182.32, angleDeg: 30},
];

const W = 920;
const H = 1440;
const CENTER_X = 460;
const CENTER_Y = 700;
const RADIUS = 280;
const LABEL_DIST = 330;

export const S08_SixWayPull: React.FC = () => {
  const frame = useCurrentFrame();
  const figO = interpolate(frame, [0, 18], [0, 1], {extrapolateRight: 'clamp'});
  const wobbleX = Math.sin(frame * 0.4) * 5;
  const wobbleY = Math.cos(frame * 0.32) * 4;

  return (
    <Stage label="08 / 互相撕扯">
      <div style={{position: 'absolute', inset: 0}}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{width: '100%', height: '100%', position: 'absolute', inset: 0}}
          preserveAspectRatio="xMidYMid meet"
        >
          {PULLS.map((p) => {
            const start = f(p.at);
            const prog = interpolate(frame, [start, start + 24], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
            const rad = (p.angleDeg * Math.PI) / 180;
            const outerX = CENTER_X + Math.cos(rad) * RADIUS;
            const outerY = CENTER_Y + Math.sin(rad) * RADIUS;
            const lineX = CENTER_X + (outerX - CENTER_X) * prog;
            const lineY = CENTER_Y + (outerY - CENTER_Y) * prog;
            return (
              <g key={'l' + p.tag} opacity={prog}>
                <line
                  x1={CENTER_X + wobbleX}
                  y1={CENTER_Y + wobbleY}
                  x2={lineX}
                  y2={lineY}
                  stroke={COLORS.accent}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray="10 8"
                />
                <polygon
                  points={`${outerX},${outerY} ${outerX - 14 * Math.cos(rad - 0.5)},${outerY - 14 * Math.sin(rad - 0.5)} ${outerX - 14 * Math.cos(rad + 0.5)},${outerY - 14 * Math.sin(rad + 0.5)}`}
                  fill={COLORS.accent}
                  opacity={prog}
                />
              </g>
            );
          })}

          <g transform={`translate(${CENTER_X + wobbleX}, ${CENTER_Y + wobbleY})`} opacity={figO}>
            <circle cx={0} cy={-50} r={28} fill={COLORS.fg} />
            <rect x={-32} y={-22} width={64} height={84} rx={14} fill={COLORS.fg} />
            <text x={0} y={110} textAnchor="middle" fill={COLORS.fg} fontFamily={FONTS.sans} fontSize="26" opacity={0.7}>
              我
            </text>
          </g>
        </svg>

        <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
          {PULLS.map((p) => {
            const start = f(p.at);
            const o = interpolate(frame, [start + 18, start + 30], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
            const rad = (p.angleDeg * Math.PI) / 180;
            const labelX = CENTER_X + Math.cos(rad) * LABEL_DIST;
            const labelY = CENTER_Y + Math.sin(rad) * LABEL_DIST;
            return (
              <div
                key={p.tag}
                style={{
                  position: 'absolute',
                  left: (labelX / W) * 100 + '%',
                  top: (labelY / H) * 100 + '%',
                  transform: 'translate(-50%, -50%)',
                  opacity: o,
                  background: COLORS.card,
                  border: `1px solid ${COLORS.cardBorder}`,
                  borderRadius: 14,
                  padding: '10px 14px',
                  color: COLORS.fg,
                  fontFamily: FONTS.sans,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{fontSize: 20, color: COLORS.accent, marginBottom: 4, letterSpacing: 1}}>{p.tag}</div>
                <div style={{fontSize: 24, fontWeight: 500}}>{p.line}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Stage>
  );
};
