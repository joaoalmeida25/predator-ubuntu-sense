import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactElement,
} from "react";

import type { NeuralCoreInternalRuntime } from "../../api/adapters/neural-core-runtime.adapter";
import { NeuralCoreCanvas } from "../../components/neural-core-canvas/neural-core-canvas.component";
import { useNeuralCoreInspection } from "../../hooks/use-neural-core-inspection/use-neural-core-inspection.hook";
import type { NeuralCoreNarrativeState } from "../../domain/narrative/neural-core-narrative.types";
import { useNeuralCoreOperationalRuntime } from "../../domain/operational-runtime/hooks/use-neural-core-operational-runtime.hook";
import { mapOperationalRuntimeToNeuralCoreNarrative } from "../../domain/operational-runtime/mappers/neural-core-operational-narrative.mapper";
import { mapOperationalRouteEventToVisualRequest } from "../../domain/operational-runtime/mappers/neural-core-operational-propagation.mapper";
import { mapOperationalRuntimeToNeuralCoreSceneDirection } from "../../domain/operational-runtime/mappers/neural-core-operational-scene-direction.mapper";
import { mapOperationalRuntimeToNeuralCoreVisualOverlay } from "../../domain/operational-runtime/mappers/neural-core-operational-visual-state.mapper";
import type { UseNeuralCoreInspectionResult } from "../../hooks/use-neural-core-inspection/use-neural-core-inspection.types";
import { resolveNeuralCoreSemanticFocusLensConfig } from "../../visualization/focus-lens/neural-core-semantic-focus-lens.utils";
import { mapNeuralCoreRuntimeToOperationalCompatibility } from "../neural-core-runtime/neural-core-runtime-compatibility.mapper";
import type { NeuralCoreRendererProps } from "./neural-core-renderer.types";

const EMPTY_INTERNAL_RUNTIME: NeuralCoreInternalRuntime = Object.freeze({
  kind: "execution",
  executionId: "internal-static-runtime",
  name: "Static structure",
  events: Object.freeze([]),
  outcome: Object.freeze({
    status: "success",
    summary: "Static structure",
    totalDurationMs: 0,
    metrics: Object.freeze([]),
    metadata: Object.freeze({}),
  }),
  autoStart: false,
  metadata: Object.freeze({}),
});

interface NeuralCoreRendererContentProps extends NeuralCoreRendererProps {
  readonly inspection: UseNeuralCoreInspectionResult;
}

const NeuralCoreRendererWithLocalInspection = (
  props: NeuralCoreRendererProps,
): ReactElement => {
  const {
    config,
    interaction,
    model,
    presentationBinding,
    runtime,
  } = props;
  const handleInternalClusterSelection = useCallback((internalClusterId?: string): void => {
    if (internalClusterId === undefined) {
      interaction.requestSelection(undefined, "user-action");
      return;
    }
    const publicClusterId = model.publicClusterIdByInternalClusterId.get(internalClusterId);
    if (publicClusterId !== undefined) {
      interaction.requestSelection(publicClusterId, "user-action");
    }
  }, [interaction, model.publicClusterIdByInternalClusterId]);
  const inspection = useNeuralCoreInspection({
    config: config.inspection,
    topology: model.topology,
    runtimeScenarioKey: presentationBinding?.presentationKey
      ?? `${model.state.mode}:${runtime?.executionId ?? "static"}`,
    interactionMode: interaction.state.mode,
    defaultInteractionMode: "presentation",
    onInteractionModeChange: interaction.requestMode,
    selectedClusterId: interaction.state.selectedClusterId,
    onSelectedClusterChange: handleInternalClusterSelection,
    paused: interaction.state.paused,
    defaultPaused: false,
    onPausedChange: interaction.requestPaused,
  });

  return <NeuralCoreRendererContent {...props} inspection={inspection} />;
};

const NeuralCoreRendererContent = ({
  config,
  inspection,
  model,
  onNarrativeStateChange,
  onReady,
  onRuntimeCompleted,
  onRuntimeEventObserved,
  onRuntimeStarted,
  presentationBinding,
  runtime,
  runtimeBinding,
}: NeuralCoreRendererContentProps): ReactElement => {
  const effectiveRuntime = runtime ?? EMPTY_INTERNAL_RUNTIME;
  const compatibility = useMemo(
    () => mapNeuralCoreRuntimeToOperationalCompatibility(effectiveRuntime, model),
    [effectiveRuntime, model],
  );
  const operationalRuntimeConfig = useMemo(() => ({
    enabled: runtime !== undefined && runtimeBinding === undefined,
    autoStart: false,
    playbackRate: 1,
    autoFollowInPresentation: true,
  }), [runtime, runtimeBinding]);
  const localOperationalRuntime = useNeuralCoreOperationalRuntime({
    execution: compatibility.execution,
    scenario: compatibility.scenario,
    config: operationalRuntimeConfig,
    suspended: inspection.state.isPaused,
    resetKey: `${model.state.mode}:${runtime?.executionId ?? "static"}`,
  });
  const operationalRuntime = runtimeBinding?.operationalRuntime ?? localOperationalRuntime;
  const readyModelIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (readyModelIdRef.current === model.modelId) {
      return;
    }
    readyModelIdRef.current = model.modelId;
    onReady?.();
  }, [model.modelId, onReady]);
  const autoStartedExecutionIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (
      runtimeBinding === undefined
      &&
      runtime?.autoStart === true
      && autoStartedExecutionIdRef.current !== runtime.executionId
    ) {
      autoStartedExecutionIdRef.current = runtime.executionId;
      operationalRuntime.run();
    }
  }, [operationalRuntime.run, runtime, runtimeBinding]);

  const previousRuntimeStatusRef = useRef(operationalRuntime.snapshot.status);
  useEffect(() => {
    const previousStatus = previousRuntimeStatusRef.current;
    const nextStatus = operationalRuntime.snapshot.status;
    previousRuntimeStatusRef.current = nextStatus;
    if (runtime === undefined || previousStatus === nextStatus) {
      return;
    }
    if (previousStatus === "idle" && nextStatus !== "idle") {
      onRuntimeStarted?.();
    }
    if (nextStatus === "completed") {
      onRuntimeCompleted?.();
    }
  }, [
    onRuntimeCompleted,
    onRuntimeStarted,
    operationalRuntime.snapshot.status,
    runtime,
  ]);

  const observedRuntimeEventIdRef = useRef<string | undefined>(undefined);
  const observedRuntimeExecutionIdRef = useRef<string | undefined>(runtime?.executionId);
  useEffect(() => {
    if (observedRuntimeExecutionIdRef.current !== runtime?.executionId) {
      observedRuntimeExecutionIdRef.current = runtime?.executionId;
      observedRuntimeEventIdRef.current = undefined;
    }
    const eventId = operationalRuntime.snapshot.activeEventId;
    if (
      runtime === undefined
      || eventId === undefined
      || observedRuntimeEventIdRef.current === eventId
    ) {
      return;
    }
    observedRuntimeEventIdRef.current = eventId;
    onRuntimeEventObserved?.(eventId);
  }, [
    onRuntimeEventObserved,
    operationalRuntime.snapshot.activeEventId,
    runtime,
  ]);

  const operationalActive = runtime !== undefined
    && operationalRuntime.snapshot.status !== "idle";
  const operationalVisualOverlay = useMemo(() => (
    operationalActive
      ? mapOperationalRuntimeToNeuralCoreVisualOverlay({
          baseTopology: model.topology,
          snapshot: operationalRuntime.snapshot,
        })
      : undefined
  ), [model.topology, operationalActive, operationalRuntime.snapshot]);
  const operationalPropagationInput = useMemo(() => {
    if (
      !operationalActive
      || operationalRuntime.activeRouteEvent === undefined
      || operationalRuntime.activeRoutePresentationEvent === undefined
      || operationalRuntime.activeRoute === undefined
    ) {
      return undefined;
    }
    return mapOperationalRouteEventToVisualRequest({
      executionId: compatibility.execution.id,
      event: operationalRuntime.activeRouteEvent,
      route: operationalRuntime.activeRoute,
      presentationEvent: operationalRuntime.activeRoutePresentationEvent,
    });
  }, [
    compatibility.execution.id,
    operationalActive,
    operationalRuntime.activeRoute,
    operationalRuntime.activeRouteEvent,
    operationalRuntime.activeRoutePresentationEvent,
  ]);
  const narrative = useMemo(() => (
    operationalActive
      ? mapOperationalRuntimeToNeuralCoreNarrative(operationalRuntime.snapshot)
      : presentationBinding?.narrative
  ), [operationalActive, operationalRuntime.snapshot, presentationBinding?.narrative]);
  const sceneDirection = useMemo(() => (
    operationalActive
      ? mapOperationalRuntimeToNeuralCoreSceneDirection(operationalRuntime.snapshot)
      : presentationBinding?.sceneDirection
  ), [operationalActive, operationalRuntime.snapshot, presentationBinding?.sceneDirection]);
  const semanticFocusLensConfig = useMemo(() => (
    presentationBinding?.semanticFocusLensConfig === undefined
      ? config.semanticFocusLens
      : resolveNeuralCoreSemanticFocusLensConfig(
          presentationBinding.semanticFocusLensConfig,
        )
  ), [config.semanticFocusLens, presentationBinding?.semanticFocusLensConfig]);
  const handleNarrativeStateChange = useCallback((state: NeuralCoreNarrativeState): void => {
    onNarrativeStateChange?.(state);
  }, [onNarrativeStateChange]);
  const handleCanvasClusterSelection = useCallback((internalClusterId?: string): void => {
    if (internalClusterId === undefined) {
      inspection.selectCluster(undefined);
      return;
    }
    const publicClusterId = model.publicClusterIdByInternalClusterId.get(internalClusterId);
    if (publicClusterId !== undefined) {
      inspection.selectCluster(publicClusterId);
    }
  }, [inspection.selectCluster, model.publicClusterIdByInternalClusterId]);

  return (
    <NeuralCoreCanvas
      fallback={<div role="status">Neural core visualization unavailable.</div>}
      choreography={presentationBinding?.choreography}
      narrative={narrative}
      narrativeConfig={config.narrative}
      onNarrativeStateChange={handleNarrativeStateChange}
      topology={model.topology}
      propagationConfig={config.propagation}
      sceneDirection={sceneDirection}
      sceneDirectionConfig={config.sceneDirection}
      sceneMotionConfig={config.sceneMotion}
      semanticVisualizationConfig={config.semantic}
      clusterLabelConfig={config.labels}
      lodConfig={config.lod}
      clusterGrammarConfig={config.clusterGrammar}
      semanticFocusLensConfig={semanticFocusLensConfig}
      spatialLayoutConfig={config.spatialLayout}
      runtimeScenarioKey={presentationBinding?.presentationKey
        ?? `${model.state.mode}:${runtime?.executionId ?? "static"}`}
      runtimePlaybackStatus={runtime === undefined
        ? undefined
        : operationalRuntime.snapshot.status}
      runtimePlaybackPaused={runtime === undefined
        ? undefined
        : operationalRuntime.snapshot.isPaused}
      runtimeFocusedClusterId={runtime === undefined
        ? undefined
        : operationalRuntime.snapshot.activeClusterId}
      operationalVisualOverlay={operationalVisualOverlay}
      operationalPropagationInput={operationalPropagationInput}
      operationalRouteProgressRef={runtime === undefined
        ? undefined
        : operationalRuntime.activeRouteProgressRef}
      cameraResetRevision={inspection.cameraResetRevision}
      inspectionConfig={config.inspection}
      inspectionFocus={inspection.focus}
      inspectionState={inspection.state}
      onCameraTransitioningChange={inspection.setCameraTransitioning}
      onSelectCluster={handleCanvasClusterSelection}
    />
  );
};

export const NeuralCoreRenderer = (props: NeuralCoreRendererProps): ReactElement => {
  if (props.inspectionBinding !== undefined) {
    return (
      <NeuralCoreRendererContent
        {...props}
        inspection={props.inspectionBinding.controller}
      />
    );
  }
  return <NeuralCoreRendererWithLocalInspection {...props} />;
};
