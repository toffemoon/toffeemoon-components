import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {SRT} from '../data/srt';
import {COLORS, FONTS} from '../theme';

export const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const current = SRT.find((line) => t >= line.start && t < line.end);
  if (!current) return null;

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          bottom: 180,
          textAlign: 'center',
          fontFamily: FONTS.sans,
          fontSize: 44,
          fontWeight: 600,
          lineHeight: 1.3,
          color: COLORS.fg,
          textShadow: '0 0 12px rgba(0,0,0,0.85), 0 2px 8px rgba(0,0,0,0.7)',
          letterSpacing: 1,
        }}
      >
        {current.text}
      </div>
    </AbsoluteFill>
  );
};
