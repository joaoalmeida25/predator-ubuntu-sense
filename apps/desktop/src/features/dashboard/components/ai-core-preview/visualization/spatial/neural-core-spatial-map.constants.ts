import type {
  NeuralCoreClusterKindSpatialProfiles,
  NeuralCoreSpatialLayoutConfig,
  NeuralCoreSpatialMapDiagnostics,
} from "./neural-core-spatial-map.types";

export const DEFAULT_NEURAL_CORE_SPATIAL_LAYOUT_CONFIG: NeuralCoreSpatialLayoutConfig = {
  deterministicSeed: 1729,
  minimumClusterSeparation: 0.38,
  maximumClusterOverlapRatio: 0.12,
  defaultClusterRadius: 0.36,
  minimumClusterRadius: 0.2,
  maximumClusterRadius: 0.62,
  reusePreviousAnchors: true,
  collisionResolution: {
    maximumAttempts: 96,
    searchStep: 0.12,
    depthStep: 0.08,
  },
};

export const NEURAL_CORE_CLUSTER_KIND_SPATIAL_PROFILES: NeuralCoreClusterKindSpatialProfiles = {
  input: { center: [-1.12, 0.32, 0.12], hint: { region: "frontal", hemisphere: "left", depth: "surface" } },
  data: { center: [-0.72, 0.04, 0.04], hint: { region: "left", hemisphere: "left", depth: "middle" } },
  memory: { center: [-0.44, -0.26, -0.3], hint: { region: "temporal", hemisphere: "center", depth: "deep" } },
  function: { center: [-0.18, 0.56, 0.04], hint: { region: "upper", hemisphere: "center", depth: "middle" } },
  process: { center: [0.16, 0.06, 0.03], hint: { region: "central", hemisphere: "center", depth: "middle" } },
  service: { center: [0.88, 0.16, 0.08], hint: { region: "right", hemisphere: "right", depth: "surface" } },
  decision: { center: [0.42, 0.34, 0.2], hint: { region: "frontal", hemisphere: "center", depth: "middle" } },
  output: { center: [1.1, -0.36, 0.12], hint: { region: "lower", hemisphere: "right", depth: "surface" } },
  event: { center: [-0.46, 0.66, 0.1], hint: { region: "outer", hemisphere: "left", depth: "surface" } },
  model: { center: [0.24, 0.48, -0.18], hint: { region: "inner", hemisphere: "center", depth: "deep" } },
  agent: { center: [0.08, -0.02, -0.28], hint: { region: "central", hemisphere: "center", depth: "deep" } },
  storage: { center: [-0.46, -0.3, -0.14], hint: { region: "temporal", hemisphere: "left", depth: "deep" } },
  api: { center: [1, 0.24, 0.12], hint: { region: "right", hemisphere: "right", depth: "surface" } },
  gateway: { center: [-1.02, 0.18, 0.14], hint: { region: "outer", hemisphere: "left", depth: "surface" } },
  queue: { center: [-0.56, -0.02, -0.08], hint: { region: "temporal", hemisphere: "left", depth: "middle" } },
  cache: { center: [-0.34, -0.18, -0.2], hint: { region: "inner", hemisphere: "center", depth: "deep" } },
  database: { center: [-0.28, -0.38, -0.24], hint: { region: "lower", hemisphere: "center", depth: "deep" } },
  "external-service": { center: [1.04, 0.08, 0.16], hint: { region: "outer", hemisphere: "right", depth: "surface" } },
  custom: { center: [0, 0, 0], hint: { region: "custom", hemisphere: "center", depth: "middle" } },
};

export const NEURAL_CORE_SPATIAL_MAP_VERSION = 1;
export const NEURAL_CORE_SPATIAL_DUPLICATE_ANCHOR_POLICY = "first-valid-wins" as const;
export const NEURAL_CORE_SPATIAL_SEPARATION_EPSILON = 0.000001;
export const EMPTY_NEURAL_CORE_SPATIAL_MAP_DIAGNOSTICS: NeuralCoreSpatialMapDiagnostics = {
  conflicts: [],
  hasUnresolvedConflicts: false,
};
export const NEURAL_CORE_SPATIAL_POSITION_LIMITS = {
  x: 1.4,
  y: 0.88,
  z: 0.68,
} as const;
