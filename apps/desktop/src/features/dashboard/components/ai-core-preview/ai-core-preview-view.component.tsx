import type { CSSProperties, ReactElement } from "react";

import styles from "./ai-core-preview.module.css";
import type {
  AiCorePreviewCallout,
  AiCorePreviewNode,
  AiCorePreviewViewProps,
} from "./ai-core-preview-view.types";
import { NeuralCoreCanvas } from "./components/neural-core-canvas/neural-core-canvas.component";
import { NeuralCoreNarrativeOverlay } from "./components/neural-core-narrative-overlay/neural-core-narrative-overlay.component";

const getNodeStyle = (node: AiCorePreviewNode): CSSProperties => {
  return {
    "--node-delay": `${-(node.id % 12) * 0.18}s`,
    "--node-depth": node.depth,
  } as CSSProperties;
};

export const AiCorePreviewView = ({
  engineVersion,
  neuralLines,
  neuralNodes,
  callouts,
  demoControls,
  operationalControls,
  contextPanel,
  inspectionControls,
  inspectionConfig,
  inspectionFocus,
  inspectionState,
  cameraResetRevision,
  choreography,
  narrative,
  narrativeConfig,
  narrativeState,
  onNarrativeStateChange,
  onCameraTransitioningChange,
  onKeyDown,
  onSelectCluster,
  topology,
  propagationConfig,
  sceneDirection,
  sceneDirectionConfig,
  sceneMotionConfig,
  semanticVisualizationConfig,
  clusterLabelConfig,
  lodConfig,
  clusterGrammarConfig,
  semanticFocusLensConfig,
  spatialMap,
  spatialLayoutConfig,
  onPropagationEvent,
  runtimeScenarioKey,
  runtimePlaybackStatus,
  runtimePlaybackPaused,
  runtimeFocusedClusterId,
  operationalVisualOverlay,
  operationalPropagationInput,
  operationalRouteProgressRef,
}: AiCorePreviewViewProps): ReactElement => {
  return (
    <section
      className={styles.corePanel}
      aria-label="AI Core preview"
      data-neural-core-label-boundary
      data-neural-core-inspection-root
      data-interaction-mode={inspectionState.mode}
      data-selection-active={inspectionFocus.selectedClusterId ? "true" : "false"}
      data-context-panel-open={contextPanel ? "true" : "false"}
      onKeyDown={onKeyDown}
    >
      <div className={styles.panelHeader}>
        <p className={styles.eyebrow}>Predator AI Core</p>
        <h2 className={styles.title}>Adaptive Neural Runtime</h2>
      </div>

      <div className={styles.stage}>
        {callouts.map((callout) => (
          <TelemetryCallout key={callout.label} {...callout} />
        ))}

        <div className={`${styles.coreHalo} ${styles.inspectionGlobalGlow}`} />
        <div className={`${styles.scanlines} ${styles.inspectionPeripheralUi}`} />

        <NeuralCoreCanvas
          fallback={<NeuralCoreFallback neuralLines={neuralLines} neuralNodes={neuralNodes} />}
          choreography={choreography}
          narrative={narrative}
          narrativeConfig={narrativeConfig}
          onNarrativeStateChange={onNarrativeStateChange}
          topology={topology}
          propagationConfig={propagationConfig}
          sceneDirection={sceneDirection}
          sceneDirectionConfig={sceneDirectionConfig}
          sceneMotionConfig={sceneMotionConfig}
          semanticVisualizationConfig={semanticVisualizationConfig}
          clusterLabelConfig={clusterLabelConfig}
          lodConfig={lodConfig}
          clusterGrammarConfig={clusterGrammarConfig}
          semanticFocusLensConfig={semanticFocusLensConfig}
          spatialMap={spatialMap}
          spatialLayoutConfig={spatialLayoutConfig}
          onPropagationEvent={onPropagationEvent}
          runtimeScenarioKey={runtimeScenarioKey}
          runtimePlaybackStatus={runtimePlaybackStatus}
          runtimePlaybackPaused={runtimePlaybackPaused}
          runtimeFocusedClusterId={runtimeFocusedClusterId}
          operationalVisualOverlay={operationalVisualOverlay}
          operationalPropagationInput={operationalPropagationInput}
          operationalRouteProgressRef={operationalRouteProgressRef}
          inspectionConfig={inspectionConfig}
          inspectionFocus={inspectionFocus}
          inspectionState={inspectionState}
          cameraResetRevision={cameraResetRevision}
          onCameraTransitioningChange={onCameraTransitioningChange}
          onSelectCluster={onSelectCluster}
        />

        <NeuralCoreNarrativeOverlay
          config={narrativeConfig}
          state={narrativeState}
        />

        {inspectionControls}
        {contextPanel}

        <div className={`${styles.energyColumn} ${styles.inspectionGlobalGlow}`} />
        <div className={`${styles.baseRing} ${styles.inspectionBaseDecoration}`} />
        <div className={`${styles.baseRingTwo} ${styles.inspectionBaseDecoration}`} />
      </div>

      {operationalControls}
      {demoControls}

      <div className={`${styles.futureNote} ${styles.inspectionPeripheralUi}`}>
        <span>AI Optimization</span>
        <p>Learning your usage patterns and optimizing runtime telemetry...</p>
        <strong>Model {engineVersion}</strong>
      </div>
    </section>
  );
};

interface NeuralCoreFallbackProps {
  neuralLines: AiCorePreviewViewProps["neuralLines"];
  neuralNodes: AiCorePreviewViewProps["neuralNodes"];
}

const NeuralCoreFallback = ({
  neuralLines,
  neuralNodes,
}: NeuralCoreFallbackProps): ReactElement => {
  return (
    <div className={styles.fallbackCore} aria-label="AI Core fallback preview">
      <svg className={styles.network} viewBox="0 0 100 100" role="img">
        <title>Granular animated neural network preview</title>
        {neuralLines.map(({ id, from, to }) => (
          <line
            key={id}
            className={styles.neuralLine}
            x1={from.x}
            x2={to.x}
            y1={from.y}
            y2={to.y}
          />
        ))}
        {neuralNodes.map((node) => (
          <circle
            key={node.id}
            className={node.isHot ? styles.neuralNodeHot : styles.neuralNode}
            cx={node.x}
            cy={node.y}
            r={node.isHot ? 1.35 + node.depth * 1.1 : 0.72 + node.depth * 0.8}
            style={getNodeStyle(node)}
          />
        ))}
      </svg>
    </div>
  );
};

const TelemetryCallout = ({
  className,
  label,
  value,
  detail,
}: AiCorePreviewCallout): ReactElement => {
  return (
    <div
      className={`${styles.callout} ${styles.inspectionPeripheralUi} ${className}`}
      data-neural-core-label-exclusion
      data-neural-core-global-callout
    >
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
};
