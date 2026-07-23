import type { ReactNode, RefObject } from "react";
import type {
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
} from "three";

import type {
  NeuralCoreConnectionBuffer,
  NeuralCoreNode,
  NeuralCoreParticleField,
  NeuralCorePointCloud,
  NeuralCorePulseField,
  NeuralCoreRing,
} from "../../visualization/graph/neural-core-graph.types";
import type {
  NeuralCorePropagationConfig,
  NeuralCorePropagationEvent,
} from "../../domain/propagation/neural-core-propagation.types";
import type {
  NeuralCorePropagationPointField,
} from "../../visualization/propagation/neural-core-propagation-buffer.types";
import type { NeuralCoreTopology } from "../../domain/topology/neural-core-topology.types";
import type { NeuralCoreChoreography } from "../../domain/choreography/neural-core-choreography.types";
import type {
  NeuralCoreSemanticConnectionField,
  NeuralCoreSemanticPointCloudField,
  NeuralCoreSemanticRibbonField,
} from "../../visualization/semantic/neural-core-semantic-buffer.types";
import type { NeuralCoreSemanticVisualizationConfig } from "../../visualization/semantic/neural-core-semantic-visual.types";
import type {
  NeuralCoreSceneDirectionConfig,
  NeuralCoreSceneDirectionTimeline,
  NeuralCoreSceneMotionConfig,
} from "../../visualization/direction/neural-core-scene-direction.types";
import type {
  NeuralCoreNarrative,
  NeuralCoreNarrativeConfig,
  NeuralCoreNarrativeState,
} from "../../domain/narrative/neural-core-narrative.types";
import type {
  NeuralCoreSpatialLayoutConfig,
  NeuralCoreSpatialMapInput,
} from "../../visualization/spatial/neural-core-spatial-map.types";
import type { NeuralCoreClusterLabelConfig } from "../../visualization/labels/neural-core-cluster-label.types";
import type { NeuralCoreLodConfig } from "../../visualization/lod/neural-core-lod.types";
import type {
  NeuralCoreInspectionConfig,
  NeuralCoreInspectionState,
} from "../../domain/inspection/neural-core-inspection.types";
import type { NeuralCoreInspectionFocusState } from "../../visualization/inspection/neural-core-inspection-focus.types";

export interface NeuralCoreSceneProps {
  choreography?: NeuralCoreChoreography;
  narrative?: NeuralCoreNarrative;
  narrativeConfig: NeuralCoreNarrativeConfig;
  onNarrativeStateChange: (state: NeuralCoreNarrativeState) => void;
  onPropagationEvent?: (event: NeuralCorePropagationEvent) => void;
  propagationConfig: NeuralCorePropagationConfig;
  sceneDirection?: NeuralCoreSceneDirectionTimeline;
  sceneDirectionConfig: NeuralCoreSceneDirectionConfig;
  sceneMotionConfig: NeuralCoreSceneMotionConfig;
  semanticVisualizationConfig: NeuralCoreSemanticVisualizationConfig;
  clusterLabelConfig: NeuralCoreClusterLabelConfig;
  lodConfig: NeuralCoreLodConfig;
  spatialMap?: NeuralCoreSpatialMapInput;
  spatialLayoutConfig: NeuralCoreSpatialLayoutConfig;
  topology?: NeuralCoreTopology;
  runtimeScenarioKey: string;
  cameraResetRevision: number;
  inspectionConfig: NeuralCoreInspectionConfig;
  inspectionFocus: NeuralCoreInspectionFocusState;
  inspectionState: NeuralCoreInspectionState;
  onCameraTransitioningChange: (transitioning: boolean) => void;
  onSelectCluster: (clusterId?: string) => void;
}

export interface NeuralCoreSceneViewProps {
  ambientPulseMaterialRef: RefObject<ShaderMaterial | null>;
  baseRef: RefObject<Group | null>;
  clusterActivationColorRef: RefObject<BufferAttribute | null>;
  clusterActivationField: NeuralCorePropagationPointField;
  clusterActivationGeometryRef: RefObject<BufferGeometry | null>;
  clusterActivationPositionRef: RefObject<BufferAttribute | null>;
  clusterActivationOpacityRef: RefObject<BufferAttribute | null>;
  clusterActivationSizeRef: RefObject<BufferAttribute | null>;
  clusterLabelOverlay?: ReactNode;
  inspectionCameraControls?: ReactNode;
  connectionBuffers: NeuralCoreConnectionBuffer[];
  connectionFields: readonly NeuralCoreSemanticConnectionField[];
  connectionRef: RefObject<Group | null>;
  coreNodes: NeuralCoreNode[];
  coreRef: RefObject<Group | null>;
  focusHaloMaterialRef: RefObject<MeshBasicMaterial | null>;
  focusHaloRef: RefObject<Mesh | null>;
  hubRef: RefObject<Group | null>;
  hubs: NeuralCoreNode[];
  networkRef: RefObject<Group | null>;
  nodeClouds: NeuralCorePointCloud[];
  nodeCloudRef: RefObject<Group | null>;
  particleField: NeuralCoreParticleField;
  particleMaterialRef: RefObject<ShaderMaterial | null>;
  particlePositionRef: RefObject<BufferAttribute | null>;
  pulseColorRef: RefObject<BufferAttribute | null>;
  pulseField: NeuralCorePulseField;
  pulsePositionRef: RefObject<BufferAttribute | null>;
  propagationPulseColorRef: RefObject<BufferAttribute | null>;
  propagationPulseField: NeuralCorePropagationPointField;
  propagationPulseGeometryRef: RefObject<BufferGeometry | null>;
  propagationPulsePositionRef: RefObject<BufferAttribute | null>;
  propagationPulseOpacityRef: RefObject<BufferAttribute | null>;
  propagationPulseSizeRef: RefObject<BufferAttribute | null>;
  propagationConfig: NeuralCorePropagationConfig;
  ringRef: RefObject<Group | null>;
  rings: NeuralCoreRing[];
  semanticPointCloudFields: readonly NeuralCoreSemanticPointCloudField[];
  semanticRibbonAttributeRefs: {
    color: RefObject<BufferAttribute | null>;
    fragmentation: RefObject<BufferAttribute | null>;
    instability: RefObject<BufferAttribute | null>;
    interruption: RefObject<BufferAttribute | null>;
    opacity: RefObject<BufferAttribute | null>;
    pulseFrequency: RefObject<BufferAttribute | null>;
    pulseIntensity: RefObject<BufferAttribute | null>;
    thickness: RefObject<BufferAttribute | null>;
  };
  semanticRibbonField: NeuralCoreSemanticRibbonField;
  semanticRibbonMaterialRef: RefObject<ShaderMaterial | null>;
  semanticVisualizationConfig: NeuralCoreSemanticVisualizationConfig;
}
