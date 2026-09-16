import type {
  NeuralCoreConfig,
  NeuralCoreConfigInput,
  NeuralCorePreset,
} from "../core/neural-core-config.types";

export const DEFAULT_NEURAL_CORE_CONFIG = {
  preset: "minimal",
  presentation: {
    showNarrative: false,
    autoRotate: false,
  },
  inspection: {
    enabled: false,
    focusSelectedCluster: false,
    pauseOnEnter: false,
    clearSelectionOnExit: true,
    contextPanel: false,
  },
  labels: {
    enabled: true,
    showStatus: false,
    showDescriptions: false,
  },
  visualization: {
    density: "minimal",
    showActivity: true,
    showRoutes: true,
  },
  accessibility: {
    motion: "system",
  },
} as const satisfies NeuralCoreConfig;

const PRESENTATION_NEURAL_CORE_CONFIG = {
  preset: "presentation",
  presentation: {
    showNarrative: true,
    autoRotate: false,
  },
  inspection: {
    enabled: false,
    focusSelectedCluster: false,
    pauseOnEnter: false,
    clearSelectionOnExit: true,
    contextPanel: false,
  },
  labels: {
    enabled: true,
    showStatus: false,
    showDescriptions: false,
  },
  visualization: {
    density: "balanced",
    showActivity: true,
    showRoutes: true,
  },
  accessibility: {
    motion: "system",
  },
} as const satisfies NeuralCoreConfig;

const INSPECTION_NEURAL_CORE_CONFIG = {
  preset: "inspection",
  presentation: {
    showNarrative: false,
    autoRotate: false,
  },
  inspection: {
    enabled: true,
    focusSelectedCluster: true,
    pauseOnEnter: true,
    clearSelectionOnExit: true,
    contextPanel: true,
  },
  labels: {
    enabled: true,
    showStatus: true,
    showDescriptions: true,
  },
  visualization: {
    density: "detailed",
    showActivity: true,
    showRoutes: true,
  },
  accessibility: {
    motion: "system",
  },
} as const satisfies NeuralCoreConfig;

const OPERATIONAL_NEURAL_CORE_CONFIG = {
  preset: "operational",
  presentation: {
    showNarrative: true,
    autoRotate: false,
  },
  inspection: {
    enabled: false,
    focusSelectedCluster: false,
    pauseOnEnter: false,
    clearSelectionOnExit: true,
    contextPanel: false,
  },
  labels: {
    enabled: true,
    showStatus: true,
    showDescriptions: false,
  },
  visualization: {
    density: "balanced",
    showActivity: true,
    showRoutes: true,
  },
  accessibility: {
    motion: "system",
  },
} as const satisfies NeuralCoreConfig;

export const NEURAL_CORE_CONFIG_PRESETS = {
  minimal: DEFAULT_NEURAL_CORE_CONFIG,
  presentation: PRESENTATION_NEURAL_CORE_CONFIG,
  inspection: INSPECTION_NEURAL_CORE_CONFIG,
  operational: OPERATIONAL_NEURAL_CORE_CONFIG,
} as const satisfies Readonly<Record<NeuralCorePreset, NeuralCoreConfig>>;

const freezeNeuralCoreConfig = (config: NeuralCoreConfig): NeuralCoreConfig => {
  Object.freeze(config.presentation);
  Object.freeze(config.inspection);
  Object.freeze(config.labels);
  Object.freeze(config.visualization);
  Object.freeze(config.accessibility);
  return Object.freeze(config);
};

freezeNeuralCoreConfig(DEFAULT_NEURAL_CORE_CONFIG);
freezeNeuralCoreConfig(PRESENTATION_NEURAL_CORE_CONFIG);
freezeNeuralCoreConfig(INSPECTION_NEURAL_CORE_CONFIG);
freezeNeuralCoreConfig(OPERATIONAL_NEURAL_CORE_CONFIG);
Object.freeze(NEURAL_CORE_CONFIG_PRESETS);

export const createNeuralCoreConfig = (
  input: NeuralCoreConfigInput = {},
): NeuralCoreConfig => {
  const preset = input.preset ?? DEFAULT_NEURAL_CORE_CONFIG.preset;
  const base = NEURAL_CORE_CONFIG_PRESETS[preset];
  const inspection = {
    ...base.inspection,
    ...input.inspection,
  };

  return freezeNeuralCoreConfig({
    preset,
    presentation: {
      ...base.presentation,
      ...input.presentation,
    },
    inspection: {
      ...inspection,
      contextPanel: inspection.enabled && inspection.contextPanel,
    },
    labels: {
      ...base.labels,
      ...input.labels,
    },
    visualization: {
      ...base.visualization,
      ...input.visualization,
    },
    accessibility: {
      ...base.accessibility,
      ...input.accessibility,
    },
  });
};
