import { useCallback, useMemo, useState, type ReactElement } from "react";

import styles from "./ai-core-preview.module.css";
import { AiCorePreviewView } from "./ai-core-preview-view.component";
import type {
  AiCorePreviewLine,
  AiCorePreviewNode,
  AiCorePreviewProps,
} from "./ai-core-preview-view.types";
import { NeuralCoreDemoControls } from "./components/neural-core-demo-controls/neural-core-demo-controls.component";
import {
  DEFAULT_NEURAL_CORE_DEMO_SCENARIO,
  NEURAL_CORE_DEMO_OPTIONS,
} from "./demos/neural-core-demo-state/neural-core-demo-state.constants";
import type { NeuralCoreDemoScenario } from "./demos/neural-core-demo-state/neural-core-demo-state.types";
import { createNeuralCoreDemoDefinition } from "./demos/neural-core-demo-state/neural-core-demo-state.utils";
import { resolveNeuralCorePropagationOptions } from "./domain/propagation/neural-core-propagation.config";
import { createNeuralCoreTopologyFromState } from "./domain/topology/neural-core-topology.mapper";
import type { NeuralCoreTopology } from "./domain/topology/neural-core-topology.types";
import { normalizeNeuralCoreTopology } from "./domain/topology/neural-core-topology.utils";
import { resolveNeuralCoreSemanticVisualizationConfig } from "./visualization/semantic/neural-core-semantic-visual.utils";
import {
  resolveNeuralCoreSceneDirectionConfig,
  resolveNeuralCoreSceneMotionConfig,
} from "./visualization/direction/neural-core-scene-direction.utils";
import {
  resolveNeuralCoreClusterGrammarConfig,
} from "./visualization/cluster-grammar/neural-core-cluster-grammar.utils";
import {
  resolveNeuralCoreSemanticFocusLensConfig,
} from "./visualization/focus-lens/neural-core-semantic-focus-lens.utils";
import { EMPTY_NEURAL_CORE_NARRATIVE_STATE } from "./domain/narrative/neural-core-narrative.constants";
import type { NeuralCoreNarrativeState } from "./domain/narrative/neural-core-narrative.types";
import { resolveNeuralCoreNarrativeConfig } from "./domain/narrative/neural-core-narrative.utils";
import { resolveNeuralCoreSpatialLayoutConfig } from "./visualization/spatial/neural-core-spatial-map.utils";
import { resolveNeuralCoreClusterLabelConfig } from "./visualization/labels/neural-core-cluster-label.utils";
import { resolveNeuralCoreLodConfig } from "./visualization/lod/neural-core-lod.utils";
import { resolveNeuralCoreInspectionConfig } from "./domain/inspection/neural-core-inspection.utils";
import { useNeuralCoreInspection } from "./hooks/use-neural-core-inspection/use-neural-core-inspection.hook";
import { NeuralCoreInspectionControls } from "./components/neural-core-inspection-controls/neural-core-inspection-controls.component";
import { NeuralCoreContextPanel } from "./components/neural-core-context-panel/neural-core-context-panel.component";

const createNeuralNodes = (): AiCorePreviewNode[] => {
  return Array.from({ length: 84 }, (_, index) => {
    const angle = index * 2.399963229728653;
    const radius = Math.sqrt(index / 84) * 42;
    const zWave = Math.sin(index * 0.74) * 9;
    const x = 50 + Math.cos(angle) * radius * (0.92 + Math.sin(index * 0.19) * 0.08);
    const y = 49 + Math.sin(angle) * radius * 0.78 + zWave;

    return {
      id: index,
      x: Math.max(7, Math.min(93, x)),
      y: Math.max(8, Math.min(91, y)),
      depth: 0.48 + ((Math.sin(index * 1.71) + 1) / 2) * 0.52,
      isHot: index % 9 === 0 || index % 17 === 0,
    };
  });
};

const getDistance = (from: AiCorePreviewNode, to: AiCorePreviewNode): number => {
  return Math.hypot(from.x - to.x, from.y - to.y);
};

const neuralNodes = createNeuralNodes();

const neuralLines: AiCorePreviewLine[] = neuralNodes.flatMap((node, index) => {
  return neuralNodes
    .filter((candidate) => candidate.id !== node.id)
    .map((candidate) => ({ candidate, distance: getDistance(node, candidate) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, index % 3 === 0 ? 3 : 2)
    .filter(({ candidate }) => candidate.id > node.id)
    .map(({ candidate }) => ({
      id: `${node.id}-${candidate.id}`,
      from: node,
      to: candidate,
    }));
});

export const AiCorePreview = ({
  nodeCountLabel,
  modelStatus,
  learningRate,
  dataFlow,
  engineVersion,
  engineStatus,
  predictionAccuracy,
  narrative,
  narrativeConfig,
  showNarrativeOverlay,
  autoRotate,
  sceneMotionConfig,
  sceneDirection,
  sceneDirectionConfig,
  state,
  choreography,
  semanticVisualizationConfig,
  spatialMap,
  spatialLayoutConfig,
  showClusterLabels,
  clusterLabelConfig,
  lodConfig,
  clusterGrammarConfig,
  semanticFocusLensConfig,
  demoScenario,
  defaultDemoScenario = DEFAULT_NEURAL_CORE_DEMO_SCENARIO,
  showDemoControls = false,
  onDemoScenarioChange,
  propagationConfig,
  propagationPreset,
  onPropagationEvent,
  inspectionEnabled,
  inspectionConfig,
  interactionMode,
  defaultInteractionMode = "presentation",
  onInteractionModeChange,
  selectedClusterId,
  defaultSelectedClusterId,
  onSelectedClusterChange,
  paused,
  defaultPaused = false,
  onPausedChange,
}: AiCorePreviewProps): ReactElement => {
  const [internalDemoScenario, setInternalDemoScenario] = useState(defaultDemoScenario);
  const [demoReplayRevision, setDemoReplayRevision] = useState(0);
  const [narrativeOverlayState, setNarrativeOverlayState] = useState<NeuralCoreNarrativeState>(
    EMPTY_NEURAL_CORE_NARRATIVE_STATE,
  );
  const selectedDemoScenario = demoScenario ?? internalDemoScenario;
  const handleDemoScenarioChange = useCallback((scenario: NeuralCoreDemoScenario): void => {
    if (demoScenario === undefined) {
      setInternalDemoScenario(scenario);
    }
    setDemoReplayRevision((revision) => revision + 1);
    onDemoScenarioChange?.(scenario);
  }, [demoScenario, onDemoScenarioChange]);
  const resolvedPropagationConfig = useMemo(() => {
    return resolveNeuralCorePropagationOptions(propagationPreset, propagationConfig);
  }, [propagationConfig, propagationPreset]);
  const resolvedSemanticVisualizationConfig = useMemo(() => {
    return resolveNeuralCoreSemanticVisualizationConfig(semanticVisualizationConfig);
  }, [semanticVisualizationConfig]);
  const resolvedSpatialLayoutConfig = useMemo(() => {
    const topologyConfig = resolvedSemanticVisualizationConfig.topology;
    return resolveNeuralCoreSpatialLayoutConfig({
      ...spatialLayoutConfig,
      minimumClusterSeparation: spatialLayoutConfig?.minimumClusterSeparation
        ?? topologyConfig.minimumClusterSeparation,
      maximumClusterOverlapRatio: spatialLayoutConfig?.maximumClusterOverlapRatio
        ?? topologyConfig.maximumClusterOverlapRatio,
    });
  }, [resolvedSemanticVisualizationConfig.topology, spatialLayoutConfig]);
  const resolvedSceneMotionConfig = useMemo(() => {
    return resolveNeuralCoreSceneMotionConfig(sceneMotionConfig, autoRotate);
  }, [autoRotate, sceneMotionConfig]);
  const resolvedClusterLabelConfig = useMemo(() => {
    return resolveNeuralCoreClusterLabelConfig({
      ...clusterLabelConfig,
      enabled: showClusterLabels ?? clusterLabelConfig?.enabled ?? false,
    });
  }, [clusterLabelConfig, showClusterLabels]);
  const resolvedLodConfig = useMemo(() => {
    return resolveNeuralCoreLodConfig(lodConfig);
  }, [lodConfig]);
  const resolvedClusterGrammarConfig = useMemo(() => {
    return resolveNeuralCoreClusterGrammarConfig(clusterGrammarConfig);
  }, [clusterGrammarConfig]);
  const resolvedSemanticFocusLensConfig = useMemo(() => {
    return resolveNeuralCoreSemanticFocusLensConfig(semanticFocusLensConfig);
  }, [semanticFocusLensConfig]);
  const resolvedSceneDirectionConfig = useMemo(() => {
    return resolveNeuralCoreSceneDirectionConfig(sceneDirectionConfig);
  }, [sceneDirectionConfig]);
  const resolvedNarrativeConfig = useMemo(() => {
    return resolveNeuralCoreNarrativeConfig(narrativeConfig, showNarrativeOverlay);
  }, [narrativeConfig, showNarrativeOverlay]);
  const resolvedInspectionConfig = useMemo(() => {
    return resolveNeuralCoreInspectionConfig({
      ...inspectionConfig,
      enabled: inspectionEnabled ?? inspectionConfig?.enabled ?? false,
    });
  }, [inspectionConfig, inspectionEnabled]);
  const demoDefinition = useMemo(() => {
    return createNeuralCoreDemoDefinition(selectedDemoScenario);
  }, [selectedDemoScenario]);
  const hasExplicitDefinition = state !== undefined || choreography !== undefined;
  const effectiveState = state ?? demoDefinition.state;
  const effectiveChoreography = choreography
    ?? (state === undefined ? demoDefinition.choreography : undefined);
  const effectiveSceneDirection = sceneDirection
    ?? (state === undefined ? demoDefinition.sceneDirection : undefined);
  const selectedNarrative = narrative
    ?? (state === undefined ? demoDefinition.narrative : undefined);
  const effectiveNarrative = resolvedNarrativeConfig.enabled
    ? selectedNarrative
    : undefined;
  const handleNarrativeStateChange = useCallback((nextState: NeuralCoreNarrativeState): void => {
    setNarrativeOverlayState((currentState) => {
      return currentState.narrativeId === nextState.narrativeId
        && currentState.activePhaseId === nextState.activePhaseId
        && currentState.isActive === nextState.isActive
        ? currentState
        : nextState;
    });
  }, []);
  const visibleNarrativeState = narrativeOverlayState.narrativeId === effectiveNarrative?.id
    ? narrativeOverlayState
    : EMPTY_NEURAL_CORE_NARRATIVE_STATE;
  const topology = useMemo((): NeuralCoreTopology | undefined => {
    if (!effectiveState) {
      return undefined;
    }

    return effectiveState.topology
      ? normalizeNeuralCoreTopology(effectiveState.topology)
      : createNeuralCoreTopologyFromState(effectiveState);
  }, [effectiveState]);
  const runtimeScenarioKey = hasExplicitDefinition
    ? `explicit:${selectedDemoScenario}:${effectiveChoreography?.id ?? "state"}:${effectiveSceneDirection?.id ?? "overview"}:${effectiveNarrative?.id ?? "no-narrative"}`
    : `${selectedDemoScenario}:${demoReplayRevision}`;
  const inspection = useNeuralCoreInspection({
    config: resolvedInspectionConfig,
    topology,
    runtimeScenarioKey,
    interactionMode,
    defaultInteractionMode,
    onInteractionModeChange,
    selectedClusterId,
    defaultSelectedClusterId,
    onSelectedClusterChange,
    paused,
    defaultPaused,
    onPausedChange,
  });

  return (
    <AiCorePreviewView
      neuralNodes={neuralNodes}
      neuralLines={neuralLines}
      inspectionControls={resolvedInspectionConfig.enabled ? (
        <NeuralCoreInspectionControls
          mode={inspection.state.mode}
          isPaused={inspection.state.isPaused}
          onEnterInspection={inspection.enterInspection}
          onExitInspection={inspection.exitInspection}
          onResetView={inspection.resetView}
          onTogglePaused={inspection.togglePaused}
        />
      ) : undefined}
      contextPanel={
        inspection.state.mode === "inspection"
        && resolvedInspectionConfig.panel.enabled
        && inspection.focus.selectedClusterId
        && topology
          ? (
            <NeuralCoreContextPanel
              clusterGrammarEnabled={resolvedClusterGrammarConfig.enabled}
              config={resolvedInspectionConfig.panel}
              focus={inspection.focus}
              topology={topology}
              onClose={inspection.clearSelection}
            />
          )
          : undefined
      }
      inspectionConfig={resolvedInspectionConfig}
      inspectionFocus={inspection.focus}
      inspectionState={inspection.state}
      cameraResetRevision={inspection.cameraResetRevision}
      onCameraTransitioningChange={inspection.setCameraTransitioning}
      onKeyDown={inspection.handleKeyDown}
      onSelectCluster={inspection.selectCluster}
      demoControls={showDemoControls ? (
        <NeuralCoreDemoControls
          currentScenario={selectedDemoScenario}
          disabled={hasExplicitDefinition}
          onScenarioChange={handleDemoScenarioChange}
          options={NEURAL_CORE_DEMO_OPTIONS}
        />
      ) : undefined}
      engineVersion={engineVersion}
      choreography={effectiveChoreography}
      narrative={effectiveNarrative}
      narrativeConfig={resolvedNarrativeConfig}
      narrativeState={visibleNarrativeState}
      onNarrativeStateChange={handleNarrativeStateChange}
      topology={topology}
      propagationConfig={resolvedPropagationConfig}
      sceneDirection={effectiveSceneDirection}
      sceneDirectionConfig={resolvedSceneDirectionConfig}
      sceneMotionConfig={resolvedSceneMotionConfig}
      semanticVisualizationConfig={resolvedSemanticVisualizationConfig}
      clusterLabelConfig={resolvedClusterLabelConfig}
      lodConfig={resolvedLodConfig}
      clusterGrammarConfig={resolvedClusterGrammarConfig}
      semanticFocusLensConfig={resolvedSemanticFocusLensConfig}
      spatialMap={spatialMap}
      spatialLayoutConfig={resolvedSpatialLayoutConfig}
      onPropagationEvent={onPropagationEvent}
      runtimeScenarioKey={runtimeScenarioKey}
      callouts={[
        {
          className: styles.calloutLeftTop,
          label: "Neural Nodes",
          value: nodeCountLabel,
          detail: "Active",
        },
        {
          className: styles.calloutLeftMiddle,
          label: "Learning Rate",
          value: learningRate,
          detail: "Optimal",
        },
        {
          className: styles.calloutLeftBottom,
          label: "Data Flow",
          value: dataFlow,
          detail: "Synaptic Throughput",
        },
        {
          className: styles.calloutRightTop,
          label: "Model Status",
          value: modelStatus,
          detail: "Continuous Learning",
        },
        {
          className: styles.calloutRightMiddle,
          label: "AI Engine",
          value: engineVersion,
          detail: engineStatus,
        },
        {
          className: styles.calloutRightBottom,
          label: "Prediction Accuracy",
          value: predictionAccuracy,
          detail: "High Confidence",
        },
      ]}
    />
  );
};
