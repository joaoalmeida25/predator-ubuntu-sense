import type { NeuralCoreConfigInput } from "../../api";
import type { NeuralCoreDemoScenario } from "../neural-core-demo-state/neural-core-demo-state.types";

interface MapNeuralCoreDemoConfigParams {
  readonly autoRotate: boolean;
  readonly inspectionEnabled: boolean;
  readonly labelsEnabled: boolean;
  readonly narrativeEnabled: boolean;
  readonly scenario: NeuralCoreDemoScenario;
  readonly showActivity: boolean;
  readonly showRoutes: boolean;
  readonly visualizationDensity: "minimal" | "balanced" | "detailed";
}

export const mapNeuralCoreDemoConfig = ({
  autoRotate,
  inspectionEnabled,
  labelsEnabled,
  narrativeEnabled,
  scenario,
  showActivity,
  showRoutes,
  visualizationDensity,
}: MapNeuralCoreDemoConfigParams): NeuralCoreConfigInput => ({
  preset: scenario === "operational-flow" ? "operational" : "presentation",
  presentation: {
    showNarrative: narrativeEnabled,
    autoRotate,
  },
  inspection: {
    enabled: inspectionEnabled,
    focusSelectedCluster: true,
    contextPanel: inspectionEnabled,
  },
  labels: {
    enabled: labelsEnabled,
  },
  visualization: {
    density: visualizationDensity,
    showActivity,
    showRoutes,
  },
  accessibility: {
    motion: "standard",
  },
});
