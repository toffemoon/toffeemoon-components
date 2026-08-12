import {Composition} from 'remotion';
import {AgentSubagent} from './AgentSubagent';
import {DURATION_FRAMES, FPS, HEIGHT, WIDTH} from './theme';

export const Root: React.FC = () => {
  return (
    <Composition
      id="AgentSubagent"
      component={AgentSubagent}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
