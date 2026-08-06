import { useCallback, useMemo, useRef, useState, type ReactElement } from "react";

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
import { NeuralCoreOperationalControls } from "./demos/operational/components/neural-core-operational-controls/neural-core-operational-controls.component";
import { NEURAL_CORE_OPERATIONAL_SUCCESS_EXECUTION_ID } from "./demos/operational/executions/request-success.execution";
import { useNeuralCoreOperationalRuntime } from "./demos/operational/hooks/use-neural-core-operational-runtime.hook";
import { mapOperationalRuntimeToNeuralCoreNarrative } from "./demos/operational/mappers/neural-core-operational-narrative.mapper";
import { mapNeuralCoreOperationalOutcomeSummary } from "./demos/operational/mappers/neural-core-operational-outcome-summary.mapper";
import { mapOperationalRouteEventToVisualRequest } from "./demos/operational/mappers/neural-core-operational-propagation.mapper";
import { mapOperationalRuntimeToNeuralCoreSceneDirection } from "./demos/operational/mappers/neural-core-operational-scene-direction.mapper";
import { mapOperationalRuntimeToNeuralCoreVisualOverlay } from "./demos/operational/mappers/neural-core-operational-visual-state.mapper";
import { getNeuralCoreOperationalScenario } from "./demos/operational/scenarios/request-processing.scenario";
import { mapNeuralCoreInspectionFocus } from "./visualization/inspection/neural-core-inspection-focus.mapper";

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

const operationalScenario = getNeuralCoreOperationalScenario();
const operationalExecutionById = new Map(
  operationalScenario.executions.map((execution) => [execution.id, execution]),
);
const operationalExecutionOptions = operationalScenario.executions.map((execution) => ({
  id: execution.id,
  label: execution.kind === "failure-recovery"
    ? "Failure + Recovery"
    : execution.shortName,
}));
const operationalStageById = new Map(
  operationalScenario.stages.map((stage) => [stage.id, stage]),
);

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
  const [selectedOperationalExecutionId, setSelectedOperationalExecutionId] = useState(
    NEURAL_CORE_OPERATIONAL_SUCCESS_EXECUTION_ID,
  );
  const [narrativeOverlayState, setNarrativeOverlayState] = useState<NeuralCoreNarrativeState>(
    EMPTY_NEURAL_CORE_NARRATIVE_STATE,
  );
  const [dismissedOperationalPanelKey, setDismissedOperationalPanelKey] = useState<string>();
  const selectedDemoScenario = demoScenario ?? internalDemoScenario;
  const handleDemoScenarioChange = useCallback((scenario: NeuralCoreDemoScenario): void => {
    if (demoScenario === undefined) {
      setInternalDemoScenario(scenario);
    }
    setDismissedOperationalPanelKey(undefined);
    setSelectedOperationalExecutionId(NEURAL_CORE_OPERATIONAL_SUCCESS_EXECUTION_ID);
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
  const operationalRuntimeEnabled = selectedDemoScenario === "operational-flow"
    && !hasExplicitDefinition;
  const baseState = state ?? demoDefinition.state;
  const effectiveChoreography = choreography
    ?? (state === undefined ? demoDefinition.choreography : undefined);
  const baseSceneDirection = sceneDirection
    ?? (state === undefined ? demoDefinition.sceneDirection : undefined);
  const baseNarrative = narrative
    ?? (state === undefined ? demoDefinition.narrative : undefined);
  const baseTopology = useMemo((): NeuralCoreTopology | undefined => {
    if (!baseState) {
      return undefined;
    }
    return baseState.topology
      ? normalizeNeuralCoreTopology(baseState.topology)
      : createNeuralCoreTopologyFromState(baseState);
  }, [baseState]);
  const runtimeScenarioKey = hasExplicitDefinition
    ? `explicit:${selectedDemoScenario}:${effectiveChoreography?.id ?? "state"}:${baseSceneDirection?.id ?? "overview"}:${baseNarrative?.id ?? "no-narrative"}`
    : `${selectedDemoScenario}:${demoReplayRevision}`;
  const inspection = useNeuralCoreInspection({
    config: resolvedInspectionConfig,
    topology: baseTopology,
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
  const operationalRuntimeConfig = useMemo(() => ({
    enabled: operationalRuntimeEnabled,
    autoStart: false,
    playbackRate: 1,
    autoFollowInPresentation: true,
  }), [operationalRuntimeEnabled]);
  const selectedOperationalExecution = operationalExecutionById.get(
    selectedOperationalExecutionId,
  ) ?? operationalScenario.executions[0];
  const operationalRuntime = useNeuralCoreOperationalRuntime({
    execution: selectedOperationalExecution,
    scenario: operationalScenario,
    config: operationalRuntimeConfig,
    suspended: inspection.state.isPaused,
    resetKey: `${selectedDemoScenario}:${demoReplayRevision}:${selectedOperationalExecution.id}`,
  });
  const topology = baseTopology;
  const operationalVisualActive = operationalRuntime.snapshot.status !== "idle";
  const operationalVisualOverlay = useMemo(() => (
    operationalRuntimeEnabled && topology && operationalVisualActive
      ? mapOperationalRuntimeToNeuralCoreVisualOverlay({
        baseTopology: topology,
        snapshot: operationalRuntime.snapshot,
      })
      : undefined
  ), [operationalRuntime.snapshot, operationalRuntimeEnabled, operationalVisualActive, topology]);
  const operationalPropagationInput = useMemo(() => {
    const event = operationalRuntime.activeRouteEvent;
    const presentationEvent = operationalRuntime.activeRoutePresentationEvent;
    const route = operationalRuntime.activeRoute;
    if (!operationalRuntimeEnabled || !event || !presentationEvent || !route) {
      return undefined;
    }
    return mapOperationalRouteEventToVisualRequest({
      executionId: selectedOperationalExecution.id,
      event,
      route,
      presentationEvent,
    });
  }, [
    operationalRuntime.activeRoute,
    operationalRuntime.activeRouteEvent,
    operationalRuntime.activeRoutePresentationEvent,
    operationalRuntimeEnabled,
    selectedOperationalExecution.id,
  ]);
  const operationalNarrativeStatus = operationalRuntime.snapshot.status === "idle"
    ? "idle"
    : operationalRuntime.snapshot.status === "completed" ? "completed" : "active";
  const operationalNarrative = useMemo(() => (
    operationalRuntimeEnabled
      ? mapOperationalRuntimeToNeuralCoreNarrative(operationalRuntime.snapshot)
      : undefined
  ), [
    operationalNarrativeStatus,
    operationalRuntime.snapshot.activeClusterId,
    operationalRuntime.snapshot.activeRouteId,
    operationalRuntime.snapshot.completedStageIds,
    operationalRuntime.snapshot.executionId,
    operationalRuntime.snapshot.narrative,
    operationalRuntime.snapshot.nextClusterId,
    operationalRuntime.snapshot.outcome,
    operationalRuntimeEnabled,
  ]);
  const selectedNarrative = operationalNarrative ?? baseNarrative;
  const effectiveNarrative = resolvedNarrativeConfig.enabled
    ? selectedNarrative
    : undefined;
  const operationalSceneDirection = useMemo(() => (
    operationalRuntimeEnabled && operationalRuntime.autoFollowInPresentation
      ? mapOperationalRuntimeToNeuralCoreSceneDirection(operationalRuntime.snapshot)
      : undefined
  ), [
    operationalRuntime.autoFollowInPresentation,
    operationalNarrativeStatus,
    operationalRuntime.snapshot.activeClusterId,
    operationalRuntime.snapshot.executionId,
    operationalRuntimeEnabled,
  ]);
  const effectiveSceneDirection = operationalSceneDirection ?? baseSceneDirection;
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
  const operationalPanelFocus = useMemo(() => (
    topology && operationalRuntime.snapshot.activeClusterId
      ? mapNeuralCoreInspectionFocus({
        topology,
        selectedClusterId: operationalRuntime.snapshot.activeClusterId,
      })
      : undefined
  ), [operationalRuntime.snapshot.activeClusterId, topology]);
  const operationalPanelKey = operationalRuntime.snapshot.narrative?.eventId;
  const manualPanelActive = inspection.focus.selectedClusterId !== undefined;
  const runtimePanelActive = operationalRuntimeEnabled
    && inspection.state.mode === "presentation"
    && operationalRuntime.snapshot.status !== "idle"
    && operationalPanelFocus?.selectedClusterId !== undefined
    && dismissedOperationalPanelKey !== operationalPanelKey;
  const contextPanelFocus = manualPanelActive ? inspection.focus : operationalPanelFocus;
  const manualPanelActiveRef = useRef(manualPanelActive);
  const operationalPanelKeyRef = useRef(operationalPanelKey);
  manualPanelActiveRef.current = manualPanelActive;
  operationalPanelKeyRef.current = operationalPanelKey;
  const handleContextPanelClose = useCallback((): void => {
    if (manualPanelActiveRef.current) {
      inspection.clearSelection();
      return;
    }
    setDismissedOperationalPanelKey(operationalPanelKeyRef.current);
  }, [inspection.clearSelection]);
  const contextPanelClusterId = contextPanelFocus?.selectedClusterId;
  const contextPanelClusterVisualState = contextPanelClusterId
    ? operationalVisualOverlay?.clusterStateById[contextPanelClusterId]
    : undefined;
  const contextPanelMetrics = contextPanelClusterId
    ? operationalVisualOverlay?.metricsByClusterId[contextPanelClusterId]
    : undefined;
  const activeOperationalStage = operationalRuntime.snapshot.activeStageId
    ? operationalStageById.get(operationalRuntime.snapshot.activeStageId)
    : undefined;
  const operationalStageName = operationalRuntime.snapshot.status === "completed"
    ? "Execution complete"
    : activeOperationalStage?.name ?? "Architecture ready";
  const operationalOutcomeSummary = useMemo(() => (
    operationalRuntime.snapshot.outcome
      ? mapNeuralCoreOperationalOutcomeSummary({
        scenario: operationalScenario,
        execution: selectedOperationalExecution,
        outcome: operationalRuntime.snapshot.outcome,
      })
      : undefined
  ), [operationalRuntime.snapshot.outcome, selectedOperationalExecution]);
  const handleOperationalRun = useCallback((): void => {
    setDismissedOperationalPanelKey(undefined);
    operationalRuntime.run();
  }, [operationalRuntime.run]);
  const handleOperationalRestart = useCallback((): void => {
    setDismissedOperationalPanelKey(undefined);
    operationalRuntime.restart();
  }, [operationalRuntime.restart]);
  const handleOperationalExecutionChange = useCallback((executionId: string): void => {
    if (!operationalExecutionById.has(executionId)) {
      return;
    }
    setDismissedOperationalPanelKey(undefined);
    setSelectedOperationalExecutionId(executionId);
  }, []);

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
        resolvedInspectionConfig.panel.enabled
        && (manualPanelActive || runtimePanelActive)
        && contextPanelFocus?.selectedClusterId
        && topology
          ? (
            <NeuralCoreContextPanel
              clusterGrammarEnabled={resolvedClusterGrammarConfig.enabled}
              config={resolvedInspectionConfig.panel}
              focus={contextPanelFocus}
              clusterVisualState={contextPanelClusterVisualState}
              metricOverrides={contextPanelMetrics}
              operationalRouteId={operationalRuntime.snapshot.activeRouteId}
              operationalImpact={operationalRuntime.snapshot.impact}
              operationalRetry={operationalRuntime.snapshot.retry}
              topology={topology}
              onClose={handleContextPanelClose}
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
      operationalControls={operationalRuntimeEnabled ? (
        <NeuralCoreOperationalControls
          executionName={selectedOperationalExecution.shortName}
          executionOptions={operationalExecutionOptions}
          selectedExecutionId={selectedOperationalExecution.id}
          selectorDisabled={
            operationalRuntime.snapshot.status !== "idle"
            && operationalRuntime.snapshot.status !== "completed"
          }
          stageName={operationalStageName}
          status={operationalRuntime.snapshot.status}
          isPaused={operationalRuntime.snapshot.isPaused}
          retry={operationalRuntime.snapshot.retry}
          outcomeSummary={operationalOutcomeSummary}
          progressBarRef={operationalRuntime.progressBarRef}
          progressLabelRef={operationalRuntime.progressLabelRef}
          onRun={handleOperationalRun}
          onPause={operationalRuntime.pause}
          onResume={operationalRuntime.resume}
          onRestart={handleOperationalRestart}
          onExecutionChange={handleOperationalExecutionChange}
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
      runtimePlaybackStatus={operationalRuntimeEnabled
        ? operationalRuntime.snapshot.status
        : undefined}
      runtimePlaybackPaused={operationalRuntimeEnabled
        ? operationalRuntime.snapshot.isPaused
        : undefined}
      runtimeFocusedClusterId={operationalRuntimeEnabled
        ? operationalRuntime.snapshot.activeClusterId
        : undefined}
      operationalVisualOverlay={operationalVisualOverlay}
      operationalPropagationInput={operationalPropagationInput}
      operationalRouteProgressRef={operationalRuntimeEnabled
        ? operationalRuntime.activeRouteProgressRef
        : undefined}
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
