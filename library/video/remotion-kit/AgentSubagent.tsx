import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {COLORS} from './theme';
import {Subtitle} from './components/Subtitle';
import {SectionFade} from './components/SectionFade';
import {S01_WhatIsAgent} from './sections/S01_WhatIsAgent';
import {S02_GenshinTeam} from './sections/S02_GenshinTeam';
import {S03_AgentAsPM} from './sections/S03_AgentAsPM';
import {S04_Overload} from './sections/S04_Overload';
import {S05_SubagentTeam} from './sections/S05_SubagentTeam';
import {S07_BreakupSubagents} from './sections/S07_BreakupSubagents';
import {S08_SixWayPull} from './sections/S08_SixWayPull';
import {S09_OSRestored} from './sections/S09_OSRestored';

export const SECTIONS = [
  {id: 'S01', from: 0, dur: 669, comp: S01_WhatIsAgent},
  {id: 'S02', from: 669, dur: 1042, comp: S02_GenshinTeam},
  {id: 'S03', from: 1711, dur: 208, comp: S03_AgentAsPM},
  {id: 'S04', from: 1919, dur: 779, comp: S04_Overload},
  {id: 'S05', from: 2698, dur: 813, comp: S05_SubagentTeam},
  {id: 'S07', from: 3511, dur: 1736, comp: S07_BreakupSubagents},
  {id: 'S08', from: 5247, dur: 301, comp: S08_SixWayPull},
  {id: 'S09', from: 5548, dur: 1390, comp: S09_OSRestored},
] as const;

export const AgentSubagent: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.bg}}>
      <Audio src={staticFile('audio.mp3')} />
      {SECTIONS.map(({id, from, dur, comp: Comp}) => (
        <Sequence key={id} from={from} durationInFrames={dur}>
          <SectionFade duration={dur}>
            <Comp />
          </SectionFade>
        </Sequence>
      ))}
      <Subtitle />
    </AbsoluteFill>
  );
};
