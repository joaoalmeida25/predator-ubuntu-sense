import type { NeuralCoreInspectionConfig as InternalInspectionConfig } from "../../domain/inspection/neural-core-inspection.types";
import { resolveNeuralCoreInspectionConfig } from "../../domain/inspection/neural-core-inspection.utils";
import type { NeuralCoreNarrativeConfig as InternalNarrativeConfig } from "../../domain/narrative/neural-core-narrative.types";
import { resolveNeuralCoreNarrativeConfig } from "../../domain/narrative/neural-core-narrative.utils";
import { resolveNeuralCorePropagationOptions } from "../../domain/propagation/neural-core-propagation.config";
import type { NeuralCorePropagationConfig as InternalPropagationConfig } from "../../domain/propagation/neural-core-propagation.types";
import type { NeuralCoreClusterGrammarConfig as InternalClusterGrammarConfig } from "../../visualization/cluster-grammar/neural-core-cluster-grammar.types";
import { resolveNeuralCoreClusterGrammarConfig } from "../../visualization/cluster-grammar/neural-core-cluster-grammar.utils";
import type {
  NeuralCoreSceneDirectionConfig as InternalSceneDirectionConfig,
  NeuralCoreSceneMotionConfig as InternalSceneMotionConfig,
} from "../../visualization/direction/neural-core-scene-direction.types";
import {
  resolveNeuralCoreSceneDirectionConfig,
  resolveNeuralCoreSceneMotionConfig,
} from "../../visualization/direction/neural-core-scene-direction.utils";
import type { NeuralCoreSemanticFocusLensConfig as InternalSemanticFocusLensConfig } from "../../visualization/focus-lens/neural-core-semantic-focus-lens.types";
import { resolveNeuralCoreSemanticFocusLensConfig } from "../../visualization/focus-lens/neural-core-semantic-focus-lens.utils";
import type { NeuralCoreClusterLabelConfig as InternalClusterLabelConfig } from "../../visualization/labels/neural-core-cluster-label.types";
import { resolveNeuralCoreClusterLabelConfig } from "../../visualization/labels/neural-core-cluster-label.utils";
import type { NeuralCoreLodConfig as InternalLodConfig } from "../../visualization/lod/neural-core-lod.types";
import { resolveNeuralCoreLodConfig } from "../../visualization/lod/neural-core-lod.utils";
import type { NeuralCoreSemanticVisualizationConfig as InternalSemanticConfig } from "../../visualization/semantic/neural-core-semantic-visual.types";
import { resolveNeuralCoreSemanticVisualizationConfig } from "../../visualization/semantic/neural-core-semantic-visual.utils";
import type { NeuralCoreSpatialLayoutConfig as InternalSpatialLayoutConfig } from "../../visualization/spatial/neural-core-spatial-map.types";
import { resolveNeuralCoreSpatialLayoutConfig } from "../../visualization/spatial/neural-core-spatial-map.utils";
import type { NeuralCoreConfig } from "../core/neural-core-config.types";

export interface NeuralCoreConfigAdapterResult {
  readonly clusterGrammar: InternalClusterGrammarConfig;
  readonly inspection: InternalInspectionConfig;
  readonly labels: InternalClusterLabelConfig;
  readonly lod: InternalLodConfig;
  readonly narrative: InternalNarrativeConfig;
  readonly propagation: InternalPropagationConfig;
  readonly sceneDirection: InternalSceneDirectionConfig;
  readonly sceneMotion: InternalSceneMotionConfig;
  readonly semantic: InternalSemanticConfig;
  readonly semanticFocusLens: InternalSemanticFocusLensConfig;
  readonly spatialLayout: InternalSpatialLayoutConfig;
}

export const adaptNeuralCoreConfig = (
  config: NeuralCoreConfig,
  reducedMotion: boolean,
): NeuralCoreConfigAdapterResult => {
  const inspectionEnabled = config.inspection.enabled;
  return Object.freeze({
    clusterGrammar: resolveNeuralCoreClusterGrammarConfig({
      enabled: config.visualization.density !== "minimal",
    }),
    inspection: resolveNeuralCoreInspectionConfig({
      enabled: inspectionEnabled,
      behavior: {
        focusSelectedCluster: config.inspection.focusSelectedCluster,
        pauseOnEnter: config.inspection.pauseOnEnter,
        clearSelectionOnExit: config.inspection.clearSelectionOnExit,
      },
      panel: {
        enabled: inspectionEnabled && config.inspection.contextPanel,
        showDescription: config.labels.showDescriptions,
      },
    }),
    labels: resolveNeuralCoreClusterLabelConfig({
      enabled: config.labels.enabled,
      content: {
        showActivityInSummary: config.labels.showStatus,
      },
    }),
    lod: resolveNeuralCoreLodConfig({
      enabled: config.visualization.density !== "detailed",
      distance: {
        detailMaximum: 3.74,
        summaryMaximum: 4.18,
      },
      limits: {
        maximumOverviewClusters: 4,
        maximumSummaryClusters: 3,
        maximumDetailClusters: 1,
      },
    }),
    narrative: resolveNeuralCoreNarrativeConfig({
      enabled: config.presentation.showNarrative,
      showOverlay: config.presentation.showNarrative,
    }),
    propagation: resolveNeuralCorePropagationOptions(undefined, {
      enabled: config.visualization.showRoutes,
    }),
    sceneDirection: resolveNeuralCoreSceneDirectionConfig({
      enabled: !reducedMotion,
    }),
    sceneMotion: resolveNeuralCoreSceneMotionConfig(
      undefined,
      !reducedMotion && config.presentation.autoRotate,
    ),
    semantic: resolveNeuralCoreSemanticVisualizationConfig({
      enabled: config.visualization.showActivity,
    }),
    semanticFocusLens: resolveNeuralCoreSemanticFocusLensConfig({
      enabled: inspectionEnabled,
    }),
    spatialLayout: resolveNeuralCoreSpatialLayoutConfig(),
  });
};
