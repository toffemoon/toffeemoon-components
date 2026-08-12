import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONTS} from '../theme';

type Props = {
  title?: string;
  body?: string;
  delay?: number;
  width?: number;
  align?: 'left' | 'center';
  variant?: 'solid' | 'ghost' | 'accent';
  children?: React.ReactNode;
};

export const Card: React.FC<Props> = ({
  title,
  body,
  delay = 0,
  width,
  align = 'left',
  variant = 'solid',
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = spring({frame: frame - delay, fps, config: {damping: 18}});
  const y = interpolate(t, [0, 1], [40, 0]);
  const opacity = interpolate(t, [0, 1], [0, 1]);

  const bg =
    variant === 'accent' ? COLORS.accent : variant === 'ghost' ? 'transparent' : COLORS.card;
  const fg = variant === 'accent' ? COLORS.bg : COLORS.fg;
  const border = variant === 'ghost' ? `1px solid ${COLORS.cardBorder}` : 'none';

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        background: bg,
        border,
        color: fg,
        padding: '32px 36px',
        borderRadius: 24,
        width,
        fontFamily: FONTS.sans,
        textAlign: align,
      }}
    >
      {title && (
        <div style={{fontSize: 28, fontWeight: 600, letterSpacing: 1, opacity: 0.7, marginBottom: 12}}>
          {title}
        </div>
      )}
      {body && <div style={{fontSize: 44, fontWeight: 500, lineHeight: 1.35}}>{body}</div>}
      {children}
    </div>
  );
};
