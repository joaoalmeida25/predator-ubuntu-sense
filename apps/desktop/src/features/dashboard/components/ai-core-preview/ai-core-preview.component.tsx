import { useCallback, useMemo, useRef, useState, type ReactElement } from "react";

import styles from "./ai-core-preview.module.css";
import { AiCorePreviewView } from "./ai-core-preview-view.component";
import type { AiCorePreviewProps } from "./ai-core-preview-view.types";
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
import { resolveNeuralCoreSceneMotionConfig } from "./visualization/direction/neural-core-scene-direction.utils";
import {
  resolveNeuralCoreClusterGrammarConfig,
} from "./visualization/cluster-grammar/neural-core-cluster-grammar.utils";
import { EMPTY_NEURAL_CORE_NARRATIVE_STATE } from "./domain/narrative/neural-core-narrative.constants";
import type { NeuralCoreNarrativeState } from "./domain/narrative/neural-core-narrative.types";
import { resolveNeuralCoreNarrativeConfig } from "./domain/narrative/neural-core-narrative.utils";
import { resolveNeuralCoreClusterLabelConfig } from "./visualization/labels/neural-core-cluster-label.utils";
import { resolveNeuralCoreLodConfig } from "./visualization/lod/neural-core-lod.utils";
import { resolveNeuralCoreInspectionConfig } from "./domain/inspection/neural-core-inspection.utils";
import { useNeuralCoreInspection } from "./hooks/use-neural-core-inspection/use-neural-core-inspection.hook";
import { NeuralCoreInspectionControls } from "./components/neural-core-inspection-controls/neural-core-inspection-controls.component";
import { NeuralCoreContextPanel } from "./components/neural-core-context-panel/neural-core-context-panel.component";
import { NeuralCoreOperationalControls } from "./demos/operational/components/neural-core-operational-controls/neural-core-operational-controls.component";
import { NEURAL_CORE_OPERATIONAL_SUCCESS_EXECUTION_ID } from "./demos/operational/executions/request-success.execution";
import { useNeuralCoreOperationalRuntime } from "./domain/operational-runtime/hooks/use-neural-core-operational-runtime.hook";
import { mapOperationalRuntimeToNeuralCoreNarrative } from "./domain/operational-runtime/mappers/neural-core-operational-narrative.mapper";
import { mapNeuralCoreOperationalOutcomeSummary } from "./demos/operational/mappers/neural-core-operational-outcome-summary.mapper";
import { mapOperationalRuntimeToNeuralCoreVisualOverlay } from "./domain/operational-runtime/mappers/neural-core-operational-visual-state.mapper";
import { getNeuralCoreOperationalScenario } from "./demos/operational/scenarios/request-processing.scenario";
import { mapNeuralCoreInspectionFocus } from "./visualization/inspection/neural-core-inspection-focus.mapper";
import { mapNeuralCoreDemoConfig } from "./demos/mappers/neural-core-demo-config.mapper";
import { mapNeuralCoreDemoModel } from "./demos/mappers/neural-core-demo-model.mapper";
import { mapNeuralCoreOperationalExecutionToPublicRuntime } from "./demos/operational/mappers/neural-core-operational-public-runtime.mapper";

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
  state,
  choreography,
  semanticVisualizationConfig,
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
  const demoModelMapping = useMemo(() => mapNeuralCoreDemoModel({
    choreography: effectiveChoreography,
    id: `demo:${selectedDemoScenario}`,
    narrative: baseNarrative,
    presentationKey: runtimeScenarioKey,
    sceneDirection: baseSceneDirection,
    state: baseState,
    topology: baseTopology,
  }), [
    baseSceneDirection,
    baseState,
    baseTopology,
    effectiveChoreography,
    baseNarrative,
    runtimeScenarioKey,
    selectedDemoScenario,
  ]);
  const publicModel = demoModelMapping.model;
  const presentationBinding = useMemo(() => ({
    ...demoModelMapping.presentation,
    ...(semanticFocusLensConfig === undefined ? {} : { semanticFocusLensConfig }),
  }), [demoModelMapping.presentation, semanticFocusLensConfig]);
  const inspectionBinding = useMemo(() => ({ controller: inspection }), [inspection]);
  const publicConfig = useMemo(() => mapNeuralCoreDemoConfig({
    autoRotate: resolvedSceneMotionConfig.autoRotate,
    inspectionEnabled: resolvedInspectionConfig.enabled,
    labelsEnabled: resolvedClusterLabelConfig.enabled,
    narrativeEnabled: resolvedNarrativeConfig.enabled,
    scenario: selectedDemoScenario,
    showActivity: resolvedSemanticVisualizationConfig.enabled,
    showRoutes: resolvedPropagationConfig.enabled,
    visualizationDensity: !resolvedClusterGrammarConfig.enabled
      ? "minimal"
      : resolvedLodConfig.enabled ? "balanced" : "detailed",
  }), [
    resolvedClusterLabelConfig.enabled,
    resolvedInspectionConfig.enabled,
    resolvedNarrativeConfig.enabled,
    resolvedClusterGrammarConfig.enabled,
    resolvedLodConfig.enabled,
    resolvedPropagationConfig.enabled,
    resolvedSemanticVisualizationConfig.enabled,
    resolvedSceneMotionConfig.autoRotate,
    selectedDemoScenario,
  ]);
  const publicRuntime = useMemo(() => (
    operationalRuntimeEnabled
      ? mapNeuralCoreOperationalExecutionToPublicRuntime(selectedOperationalExecution)
      : undefined
  ), [operationalRuntimeEnabled, selectedOperationalExecution]);
  const operationalRuntime = useNeuralCoreOperationalRuntime({
    execution: selectedOperationalExecution,
    scenario: operationalScenario,
    config: operationalRuntimeConfig,
    suspended: inspection.state.isPaused,
    resetKey: `${selectedDemoScenario}:${demoReplayRevision}:${selectedOperationalExecution.id}`,
  });
  const runtimeBinding = useMemo(() => (
    operationalRuntimeEnabled ? { operationalRuntime } : undefined
  ), [operationalRuntime, operationalRuntimeEnabled]);
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
  const publicInteractionState = useMemo(() => ({
    mode: inspection.state.mode,
    selectedClusterId: inspection.state.selectedClusterId,
    paused: inspection.state.isPaused,
  }), [
    inspection.state.isPaused,
    inspection.state.mode,
    inspection.state.selectedClusterId,
  ]);
  const handlePublicInteractionStateChange = useCallback((nextState: {
    readonly mode: "presentation" | "inspection";
    readonly selectedClusterId?: string;
    readonly paused: boolean;
  }): void => {
    if (nextState.mode !== inspection.state.mode) {
      if (nextState.mode === "inspection") {
        inspection.enterInspection();
      } else {
        inspection.exitInspection();
      }
    }
    if (nextState.selectedClusterId !== inspection.state.selectedClusterId) {
      if (nextState.selectedClusterId === undefined) {
        inspection.clearSelection();
      } else {
        inspection.selectCluster(nextState.selectedClusterId);
      }
    }
    if (nextState.paused !== inspection.state.isPaused) {
      inspection.togglePaused();
    }
  }, [inspection]);

  return (
    <AiCorePreviewView
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
      inspectionFocus={inspection.focus}
      inspectionState={inspection.state}
      onKeyDown={inspection.handleKeyDown}
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
      narrativeConfig={resolvedNarrativeConfig}
      narrativeState={visibleNarrativeState}
      onNarrativeStateChange={handleNarrativeStateChange}
      publicModel={publicModel}
      publicConfig={publicConfig}
      publicRuntime={publicRuntime}
      inspectionBinding={inspectionBinding}
      presentationBinding={presentationBinding}
      runtimeBinding={runtimeBinding}
      publicInteractionState={publicInteractionState}
      onPublicInteractionStateChange={handlePublicInteractionStateChange}
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
