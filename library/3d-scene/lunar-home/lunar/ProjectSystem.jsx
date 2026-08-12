import { useCallback } from "react";
import { ProjectAsteroid } from "./ProjectAsteroid.jsx";
import { LUNAR_BODY_LAYOUT } from "./lunarModel.js";

const LAYOUT_BY_ID = new Map(
  LUNAR_BODY_LAYOUT.map((layout) => [layout.id, layout]),
);

export function ProjectSystem({
  items,
  systemRef,
  bodyRefs,
  activeId,
  selectedId,
  discoveryCueId,
  motionAllowed,
  mode,
  scrollAuthorityRef,
  projectInteractionEnabled = true,
  onBodyHover,
  onBodySelect,
}) {
  const registerBody = useCallback(
    (id, body) => {
      if (body) bodyRefs.current.set(id, body);
      else bodyRefs.current.delete(id);
    },
    [bodyRefs],
  );

  return (
    <group ref={systemRef} position={[0.92, -0.02, -0.35]}>
      {items.map((item) => {
        const layout = LAYOUT_BY_ID.get(item.id);
        if (!layout) return null;
        return (
          <ProjectAsteroid
            key={item.id}
            item={item}
            layout={layout}
            active={activeId === item.id}
            selected={selectedId === item.id}
            discoveryCue={discoveryCueId === item.id}
            motionAllowed={motionAllowed}
            mode={mode}
            scrollAuthorityRef={scrollAuthorityRef}
            projectInteractionEnabled={projectInteractionEnabled}
            registerBody={registerBody}
            onHover={onBodyHover}
            onSelect={onBodySelect}
          />
        );
      })}
    </group>
  );
}
