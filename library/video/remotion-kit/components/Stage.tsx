import {AbsoluteFill} from 'remotion';
import {COLORS, FONTS} from '../theme';

type Props = {
  label?: string;
  children: React.ReactNode;
};

export const Stage: React.FC<Props> = ({label, children}) => {
  return (
    <AbsoluteFill
      style={{
        padding: '120px 80px',
        fontFamily: FONTS.sans,
        color: COLORS.fg,
      }}
    >
      {label && (
        <div
          style={{
            position: 'absolute',
            top: 64,
            left: 80,
            fontSize: 22,
            letterSpacing: 4,
            color: COLORS.fgDim,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
      )}
      <AbsoluteFill style={{padding: '160px 80px 320px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
