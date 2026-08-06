import type { Dispatch, SetStateAction } from "react";
import type { Camera, Group } from "three";

import type { NeuralCoreTopology } from "../../domain/topology/neural-core-topology.types";
import type { NeuralCoreNarrativeState } from "../../domain/narrative/neural-core-narrative.types";
import type { NeuralCoreVector3 } from "../../visualization/graph/neural-core-graph.types";
import type { NeuralCoreLodConfig } from "../../visualization/lod/neural-core-lod.types";
import type {
  NeuralCoreClusterLabelConfig,
  NeuralCoreClusterLabelModel,
} from "../../visualization/labels/neural-core-cluster-label.types";
import type { NeuralCoreSpatialMap } from "../../visualization/spatial/neural-core-spatial-map.types";
import type { NeuralCoreTopologyVisualState } from "../../visualization/topology/neural-core-topology-visual.types";
import type { NeuralCoreSceneDirectionState } from "../../visualization/direction/neural-core-scene-direction.types";
import type { NeuralCoreInteractionMode } from "../../domain/inspection/neural-core-inspection.types";
import type { NeuralCoreInspectionFocusState } from "../../visualization/inspection/neural-core-inspection-focus.types";
import type {
  NeuralCoreOperationalVisualOverlay,
} from "../../demos/operational/mappers/neural-core-operational-visual-state.mapper";

export interface UseNeuralCoreClusterLabelsParams {
  config: NeuralCoreClusterLabelConfig;
  lodConfig: NeuralCoreLodConfig;
  runtimeScenarioKey: string;
  spatialMap: NeuralCoreSpatialMap;
  topology: NeuralCoreTopology;
  topologyVisualState: NeuralCoreTopologyVisualState;
  operationalOverlay?: NeuralCoreOperationalVisualOverlay;
}

export interface AdvanceNeuralCoreClusterLabelsParams {
  camera: Camera;
  cameraLocalPosition: NeuralCoreVector3;
  deltaSeconds: number;
  directionState: NeuralCoreSceneDirectionState;
  elapsedSeconds: number;
  narrativeState: NeuralCoreNarrativeState;
  inspectionFocus: NeuralCoreInspectionFocusState;
  interactionMode: NeuralCoreInteractionMode;
  isContextPanelOpen: boolean;
  network: Group | null;
  viewport: { width: number; height: number };
  clusterGrammarEnabled?: boolean;
  clusterGrammarVisibleTerritoryIds?: readonly string[];
}

export interface UseNeuralCoreClusterLabelsResult {
  models: readonly NeuralCoreClusterLabelModel[];
  advance: (params: AdvanceNeuralCoreClusterLabelsParams) => void;
  registerLabelElement: (clusterId: string, element: HTMLElement | null) => void;
  registerLeaderLineElement: (clusterId: string, element: SVGLineElement | null) => void;
  registerOverlayElement: (element: HTMLDivElement | null) => void;
}

export type NeuralCoreClusterLabelModelsDispatch = Dispatch<
SetStateAction<readonly NeuralCoreClusterLabelModel[]>
>;
