import {
  useCallback,
  useEffect,
  useMemo,
  type ReactElement,
} from "react";

import { NeuralCoreRenderer } from "../../controllers/neural-core-renderer/neural-core-renderer.component";
import { useNeuralCoreRendererObservers } from "../../controllers/neural-core-renderer/neural-core-renderer-observers.context";
import { useNeuralCoreInspectionBinding } from "../../controllers/neural-core-renderer/neural-core-inspection-binding.context";
import { useNeuralCorePresentationBinding } from "../../controllers/neural-core-renderer/neural-core-presentation-binding.context";
import { useNeuralCoreModelCompatibility } from "../../controllers/neural-core-renderer/neural-core-model-compatibility.context";
import { useNeuralCoreRuntimeBinding } from "../../controllers/neural-core-runtime/neural-core-runtime-binding.context";
import { adaptNeuralCoreConfig } from "../adapters/neural-core-config.adapter";
import {
  adaptModelDiagnosticsToPublicError,
  adaptRuntimeDiagnosticsToPublicError,
} from "../adapters/neural-core-error.adapter";
import {
  createNeuralCoreExecutionCompletedEvent,
  createNeuralCoreExecutionStartedEvent,
  createNeuralCoreReadyEvent,
  createNeuralCoreRuntimeEventObservedEvent,
} from "../adapters/neural-core-event.adapter";
import { adaptNeuralCoreModel } from "../adapters/neural-core-model.adapter";
import { adaptNeuralCoreRuntime } from "../adapters/neural-core-runtime.adapter";
import { createNeuralCoreConfig } from "../defaults/neural-core-config.defaults";
import { createNeuralCoreModel } from "../validation/neural-core-model.validation";
import { createNeuralCoreRuntime } from "../validation/neural-core-runtime.validation";
import styles from "./neural-core.module.css";
import type { NeuralCoreProps } from "./neural-core-props.types";
import { useNeuralCoreInteraction } from "./use-neural-core-interaction.hook";
import { useNeuralCoreMotionPreference } from "./use-neural-core-motion-preference.hook";
import { useNeuralCorePublicEvents } from "./use-neural-core-public-events.hook";

const diagnosticIdentity = (
  prefix: string,
  diagnostics: readonly { readonly code: string; readonly path?: readonly (string | number)[] }[],
): string => `${prefix}:${diagnostics.map((diagnostic) => (
  `${diagnostic.code}@${diagnostic.path?.join(".") ?? "root"}`
)).join("|")}`;

export const NeuralCore = (props: NeuralCoreProps): ReactElement => {
  const {
    ariaLabel = "Neural core visualization",
    className,
    config: configInput,
    model: modelInput,
    onError,
    onEvent,
    runtime: runtimeInput,
  } = props;
  const runtimeBinding = useNeuralCoreRuntimeBinding();
  const inspectionBinding = useNeuralCoreInspectionBinding();
  const modelCompatibility = useNeuralCoreModelCompatibility();
  const presentationBinding = useNeuralCorePresentationBinding();
  const rendererObservers = useNeuralCoreRendererObservers();
  const { emitEvent, reportErrorOnce } = useNeuralCorePublicEvents({ onError, onEvent });
  const modelResult = useMemo(() => createNeuralCoreModel(modelInput), [modelInput]);
  const resolvedModel = modelResult.ok ? modelResult.value : undefined;
  const config = useMemo(() => createNeuralCoreConfig(configInput), [configInput]);
  const reducedMotion = useNeuralCoreMotionPreference(config.accessibility.motion);
  const adaptedConfig = useMemo(
    () => adaptNeuralCoreConfig(config, reducedMotion),
    [config, reducedMotion],
  );
  const adaptedModel = useMemo(
    () => resolvedModel === undefined
      ? undefined
      : adaptNeuralCoreModel(resolvedModel, modelCompatibility),
    [modelCompatibility, resolvedModel],
  );
  const runtimeResult = useMemo(() => {
    if (runtimeInput === undefined || resolvedModel === undefined) {
      return undefined;
    }
    return createNeuralCoreRuntime(runtimeInput, resolvedModel);
  }, [resolvedModel, runtimeInput]);
  const resolvedRuntime = runtimeResult?.ok === true ? runtimeResult.value : undefined;
  const adaptedRuntime = useMemo(
    () => resolvedRuntime === undefined ? undefined : adaptNeuralCoreRuntime(resolvedRuntime),
    [resolvedRuntime],
  );
  const interaction = useNeuralCoreInteraction({
    binding: props,
    emitEvent,
    executionId: resolvedRuntime?.execution.id,
    model: resolvedModel,
    reportInteractionError: reportErrorOnce,
  });
  const handleReady = useCallback((): void => {
    if (resolvedModel !== undefined) {
      emitEvent(createNeuralCoreReadyEvent(resolvedModel.id));
    }
  }, [emitEvent, resolvedModel]);
  const handleRuntimeStarted = useCallback((): void => {
    if (resolvedRuntime !== undefined) {
      emitEvent(createNeuralCoreExecutionStartedEvent(resolvedRuntime.execution));
    }
  }, [emitEvent, resolvedRuntime]);
  const handleRuntimeCompleted = useCallback((): void => {
    if (resolvedRuntime !== undefined) {
      emitEvent(createNeuralCoreExecutionCompletedEvent(resolvedRuntime.execution));
    }
  }, [emitEvent, resolvedRuntime]);
  const handleRuntimeEventObserved = useCallback((eventId: string): void => {
    if (resolvedRuntime === undefined) {
      return;
    }
    const event = resolvedRuntime.execution.events.find((candidate) => candidate.id === eventId);
    if (event !== undefined) {
      emitEvent(createNeuralCoreRuntimeEventObservedEvent(resolvedRuntime.execution, event));
    }
  }, [emitEvent, resolvedRuntime]);

  useEffect(() => {
    if (modelResult.ok) {
      return;
    }
    reportErrorOnce(
      diagnosticIdentity(`model:${modelInput.id}`, modelResult.diagnostics),
      adaptModelDiagnosticsToPublicError(modelResult.diagnostics),
    );
  }, [modelInput.id, modelResult, reportErrorOnce]);

  useEffect(() => {
    if (runtimeResult === undefined || runtimeResult.ok) {
      return;
    }
    reportErrorOnce(
      diagnosticIdentity(`runtime:${runtimeInput?.execution.id ?? "none"}`, runtimeResult.diagnostics),
      adaptRuntimeDiagnosticsToPublicError(runtimeResult.diagnostics),
    );
  }, [reportErrorOnce, runtimeInput?.execution.id, runtimeResult]);

  const rootClassName = className === undefined ? styles.root : `${styles.root} ${className}`;
  if (!modelResult.ok || adaptedModel === undefined) {
    return (
      <div className={rootClassName} role="alert" aria-label={ariaLabel}>
        <div className={styles.fallback}>Unable to display the neural core model.</div>
      </div>
    );
  }

  return (
    <div
      className={rootClassName}
      role="region"
      aria-label={ariaLabel}
      data-neural-core-public-root
    >
      <NeuralCoreRenderer
        config={adaptedConfig}
        interaction={interaction}
        inspectionBinding={inspectionBinding}
        model={adaptedModel}
        onReady={handleReady}
        onNarrativeStateChange={rendererObservers.onNarrativeStateChange}
        onRuntimeCompleted={handleRuntimeCompleted}
        onRuntimeEventObserved={handleRuntimeEventObserved}
        onRuntimeStarted={handleRuntimeStarted}
        presentationBinding={presentationBinding}
        runtime={adaptedRuntime}
        runtimeBinding={runtimeBinding}
      />
    </div>
  );
};
