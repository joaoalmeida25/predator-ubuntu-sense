import type { ReactElement } from "react";

import styles from "./ai-core-preview.module.css";
import type {
  AiCorePreviewCallout,
  AiCorePreviewViewProps,
} from "./ai-core-preview-view.types";
import { NeuralCore } from "./api";
import { NeuralCoreRuntimeBindingProvider } from "./controllers/neural-core-runtime/neural-core-runtime-binding.context";
import { NeuralCoreRendererObserversProvider } from "./controllers/neural-core-renderer/neural-core-renderer-observers.context";
import { NeuralCoreInspectionBindingProvider } from "./controllers/neural-core-renderer/neural-core-inspection-binding.context";
import { NeuralCorePresentationBindingProvider } from "./controllers/neural-core-renderer/neural-core-presentation-binding.context";
import { NeuralCoreModelCompatibilityProvider } from "./controllers/neural-core-renderer/neural-core-model-compatibility.context";
import { NeuralCoreNarrativeOverlay } from "./components/neural-core-narrative-overlay/neural-core-narrative-overlay.component";

export const AiCorePreviewView = ({
  engineVersion,
  callouts,
  demoControls,
  operationalControls,
  contextPanel,
  inspectionControls,
  inspectionFocus,
  inspectionState,
  narrativeConfig,
  narrativeState,
  onNarrativeStateChange,
  onKeyDown,
  publicConfig,
  publicInteractionState,
  publicModel,
  publicRuntime,
  inspectionBinding,
  modelCompatibility,
  presentationBinding,
  runtimeBinding,
  onPublicInteractionStateChange,
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

        <NeuralCoreRendererObserversProvider observers={{ onNarrativeStateChange }}>
          <NeuralCoreInspectionBindingProvider binding={inspectionBinding}>
            <NeuralCoreModelCompatibilityProvider compatibility={modelCompatibility}>
              <NeuralCorePresentationBindingProvider binding={presentationBinding}>
                <NeuralCoreRuntimeBindingProvider binding={runtimeBinding}>
                  <NeuralCore
                    model={publicModel}
                    config={publicConfig}
                    runtime={publicRuntime}
                    interactionState={publicInteractionState}
                    onInteractionStateChange={onPublicInteractionStateChange}
                    ariaLabel="AI Core visualization"
                  />
                </NeuralCoreRuntimeBindingProvider>
              </NeuralCorePresentationBindingProvider>
            </NeuralCoreModelCompatibilityProvider>
          </NeuralCoreInspectionBindingProvider>
        </NeuralCoreRendererObserversProvider>

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
