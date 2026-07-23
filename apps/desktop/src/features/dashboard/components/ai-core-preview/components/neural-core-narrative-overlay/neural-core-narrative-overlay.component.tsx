import type { CSSProperties, ReactElement } from "react";

import { NeuralCoreNarrativeOverlayView } from "./neural-core-narrative-overlay-view.component";
import type { NeuralCoreNarrativeOverlayProps } from "./neural-core-narrative-overlay-view.types";

type NarrativeOverlayStyle = CSSProperties & {
  "--narrative-fade-in": string;
  "--narrative-fade-out": string;
  "--narrative-fade-out-delay": string;
};

export const NeuralCoreNarrativeOverlay = ({
  config,
  state,
}: NeuralCoreNarrativeOverlayProps): ReactElement | null => {
  if (!config.enabled || !config.showOverlay || !state.isActive || !state.label) {
    return null;
  }

  const fadeInSeconds = Math.min(
    config.transition.fadeInSeconds,
    state.phaseDurationSeconds * 0.35,
  );
  const fadeOutSeconds = Math.min(
    config.transition.fadeOutSeconds,
    state.phaseDurationSeconds * 0.35,
  );
  const fadeOutDelay = Math.max(
    fadeInSeconds,
    state.phaseDurationSeconds - fadeOutSeconds,
  );
  const progress = config.showProgress ? state.progress : undefined;
  const progressLabel = progress
    ? `${progress.label ? `${progress.label} · ` : ""}${progress.current} / ${progress.total}`
    : undefined;
  const style: NarrativeOverlayStyle = {
    "--narrative-fade-in": `${fadeInSeconds}s`,
    "--narrative-fade-out": `${fadeOutSeconds}s`,
    "--narrative-fade-out-delay": `${fadeOutDelay}s`,
  };

  return (
    <NeuralCoreNarrativeOverlayView
      description={config.showDescription ? state.description : undefined}
      label={state.label}
      phaseKey={`${state.narrativeId}:${state.activePhaseId}`}
      progressLabel={progressLabel}
      style={style}
    />
  );
};
