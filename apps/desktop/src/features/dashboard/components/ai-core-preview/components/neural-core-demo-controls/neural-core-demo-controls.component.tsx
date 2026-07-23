import { useId, type ReactElement } from "react";

import { NeuralCoreDemoControlsView } from "./neural-core-demo-controls-view.component";
import type { NeuralCoreDemoControlsProps } from "./neural-core-demo-controls-view.types";

export const NeuralCoreDemoControls = ({
  currentScenario,
  disabled,
  onScenarioChange,
  options,
}: NeuralCoreDemoControlsProps): ReactElement => {
  const descriptionId = useId();
  const selectedOption = options.find(({ scenario }) => Object.is(scenario, currentScenario))
    ?? options[0];

  return (
    <NeuralCoreDemoControlsView
      currentScenario={currentScenario}
      descriptionId={descriptionId}
      disabled={disabled}
      onScenarioChange={onScenarioChange}
      options={options}
      selectedOption={selectedOption}
    />
  );
};
