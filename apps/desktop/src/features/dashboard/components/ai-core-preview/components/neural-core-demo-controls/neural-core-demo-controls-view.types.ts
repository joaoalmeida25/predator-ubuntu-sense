import type {
  NeuralCoreDemoOption,
  NeuralCoreDemoScenario,
} from "../../demos/neural-core-demo-state/neural-core-demo-state.types";

export interface NeuralCoreDemoControlsProps {
  currentScenario: NeuralCoreDemoScenario;
  disabled: boolean;
  onScenarioChange: (scenario: NeuralCoreDemoScenario) => void;
  options: readonly NeuralCoreDemoOption[];
}

export interface NeuralCoreDemoControlsViewProps extends NeuralCoreDemoControlsProps {
  descriptionId: string;
  selectedOption: NeuralCoreDemoOption;
}
