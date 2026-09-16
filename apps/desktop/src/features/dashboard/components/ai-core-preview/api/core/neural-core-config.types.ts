export type NeuralCorePreset =
  | "minimal"
  | "presentation"
  | "inspection"
  | "operational";

export type NeuralCoreVisualizationDensity = "minimal" | "balanced" | "detailed";
export type NeuralCoreMotionPreference = "system" | "reduced" | "standard";

export interface NeuralCorePresentationConfigInput {
  readonly showNarrative?: boolean;
  readonly autoRotate?: boolean;
}

export interface NeuralCorePresentationConfig {
  readonly showNarrative: boolean;
  readonly autoRotate: boolean;
}

export interface NeuralCoreInspectionConfigInput {
  readonly enabled?: boolean;
  readonly focusSelectedCluster?: boolean;
  readonly pauseOnEnter?: boolean;
  readonly clearSelectionOnExit?: boolean;
  readonly contextPanel?: boolean;
}

export interface NeuralCoreInspectionConfig {
  readonly enabled: boolean;
  readonly focusSelectedCluster: boolean;
  readonly pauseOnEnter: boolean;
  readonly clearSelectionOnExit: boolean;
  readonly contextPanel: boolean;
}

export interface NeuralCoreLabelsConfigInput {
  readonly enabled?: boolean;
  readonly showStatus?: boolean;
  readonly showDescriptions?: boolean;
}

export interface NeuralCoreLabelsConfig {
  readonly enabled: boolean;
  readonly showStatus: boolean;
  readonly showDescriptions: boolean;
}

export interface NeuralCoreVisualizationConfigInput {
  readonly density?: NeuralCoreVisualizationDensity;
  readonly showActivity?: boolean;
  readonly showRoutes?: boolean;
}

export interface NeuralCoreVisualizationConfig {
  readonly density: NeuralCoreVisualizationDensity;
  readonly showActivity: boolean;
  readonly showRoutes: boolean;
}

export interface NeuralCoreAccessibilityConfigInput {
  readonly motion?: NeuralCoreMotionPreference;
}

export interface NeuralCoreAccessibilityConfig {
  readonly motion: NeuralCoreMotionPreference;
}

export interface NeuralCoreConfigInput {
  readonly preset?: NeuralCorePreset;
  readonly presentation?: NeuralCorePresentationConfigInput;
  readonly inspection?: NeuralCoreInspectionConfigInput;
  readonly labels?: NeuralCoreLabelsConfigInput;
  readonly visualization?: NeuralCoreVisualizationConfigInput;
  readonly accessibility?: NeuralCoreAccessibilityConfigInput;
}

export interface NeuralCoreConfig {
  readonly preset: NeuralCorePreset;
  readonly presentation: NeuralCorePresentationConfig;
  readonly inspection: NeuralCoreInspectionConfig;
  readonly labels: NeuralCoreLabelsConfig;
  readonly visualization: NeuralCoreVisualizationConfig;
  readonly accessibility: NeuralCoreAccessibilityConfig;
}
