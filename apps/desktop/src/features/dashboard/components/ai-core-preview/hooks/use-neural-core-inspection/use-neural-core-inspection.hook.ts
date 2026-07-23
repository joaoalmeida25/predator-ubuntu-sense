import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import type { NeuralCoreInteractionMode } from "../../domain/inspection/neural-core-inspection.types";
import {
  resolveNeuralCoreControlledUpdate,
  resolveNeuralCoreControlledValue,
} from "../../domain/inspection/neural-core-inspection.utils";
import { EMPTY_NEURAL_CORE_TOPOLOGY } from "../../domain/topology/neural-core-topology.constants";
import { mapNeuralCoreInspectionFocus } from "../../visualization/inspection/neural-core-inspection-focus.mapper";
import type {
  UseNeuralCoreInspectionParams,
  UseNeuralCoreInspectionResult,
} from "./use-neural-core-inspection.types";

interface ControlledValueResult<TValue> {
  value: TValue;
  setValue: (value: TValue) => void;
}

const useControlledValue = <TValue,>(
  controlledValue: TValue | undefined,
  defaultValue: TValue,
  onChange?: (value: TValue) => void,
): ControlledValueResult<TValue> => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = resolveNeuralCoreControlledValue(controlledValue, internalValue);
  const valueRef = useRef(value);
  const callbackRef = useRef(onChange);
  valueRef.current = value;
  callbackRef.current = onChange;
  const setValue = useCallback((nextValue: TValue): void => {
    const update = resolveNeuralCoreControlledUpdate(
      controlledValue,
      valueRef.current,
      nextValue,
    );
    if (!update.changed) {
      return;
    }
    if (update.shouldUpdateInternal) {
      setInternalValue(update.nextInternalValue);
    }
    callbackRef.current?.(nextValue);
  }, [controlledValue]);
  return { value, setValue };
};

export const useNeuralCoreInspection = ({
  config,
  defaultInteractionMode,
  defaultPaused,
  defaultSelectedClusterId,
  interactionMode,
  onInteractionModeChange,
  onPausedChange,
  onSelectedClusterChange,
  paused,
  runtimeScenarioKey,
  selectedClusterId,
  topology,
}: UseNeuralCoreInspectionParams): UseNeuralCoreInspectionResult => {
  const modeControl = useControlledValue(
    interactionMode,
    defaultInteractionMode,
    onInteractionModeChange,
  );
  const selectionControl = useControlledValue<string | undefined>(
    selectedClusterId,
    defaultSelectedClusterId,
    onSelectedClusterChange,
  );
  const pauseControl = useControlledValue(paused, defaultPaused, onPausedChange);
  const [isCameraTransitioning, setCameraTransitioning] = useState(false);
  const [cameraResetRevision, setCameraResetRevision] = useState(0);
  const mode: NeuralCoreInteractionMode = config.enabled
    ? modeControl.value
    : "presentation";
  const focus = useMemo(() => {
    return mapNeuralCoreInspectionFocus({
      topology: topology ?? EMPTY_NEURAL_CORE_TOPOLOGY,
      selectedClusterId: selectionControl.value,
    });
  }, [selectionControl.value, topology]);

  const clearSelection = useCallback((): void => {
    selectionControl.setValue(undefined);
  }, [selectionControl.setValue]);

  const selectCluster = useCallback((clusterId?: string): void => {
    if (mode !== "inspection") {
      return;
    }
    selectionControl.setValue(clusterId);
  }, [mode, selectionControl.setValue]);

  const enterInspection = useCallback((): void => {
    if (config.enabled) {
      if (config.behavior.pauseOnEnter) {
        pauseControl.setValue(true);
      }
      modeControl.setValue("inspection");
    }
  }, [config.behavior.pauseOnEnter, config.enabled, modeControl.setValue, pauseControl.setValue]);

  const exitInspection = useCallback((): void => {
    if (config.behavior.clearSelectionOnExit) {
      clearSelection();
    }
    modeControl.setValue("presentation");
  }, [clearSelection, config.behavior.clearSelectionOnExit, modeControl.setValue]);

  const togglePaused = useCallback((): void => {
    pauseControl.setValue(!pauseControl.value);
  }, [pauseControl.setValue, pauseControl.value]);

  const resetView = useCallback((): void => {
    clearSelection();
    setCameraTransitioning(true);
    setCameraResetRevision((revision) => revision + 1);
  }, [clearSelection]);

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLElement>): void => {
    if (
      event.key === "Escape"
      && mode === "inspection"
      && selectionControl.value !== undefined
    ) {
      event.preventDefault();
      clearSelection();
    }
  }, [clearSelection, mode, selectionControl.value]);

  const previousModeRef = useRef(mode);
  useEffect(() => {
    const previousMode = previousModeRef.current;
    previousModeRef.current = mode;
    if (previousMode !== "inspection" && mode === "inspection" && config.behavior.pauseOnEnter) {
      pauseControl.setValue(true);
    }
    if (
      previousMode === "inspection"
      && mode === "presentation"
      && config.behavior.clearSelectionOnExit
    ) {
      clearSelection();
    }
  }, [clearSelection, config.behavior, mode, pauseControl.setValue]);

  const previousSelectionRef = useRef(selectionControl.value);
  useEffect(() => {
    const previousSelection = previousSelectionRef.current;
    previousSelectionRef.current = selectionControl.value;
    if (
      mode === "inspection"
      && config.behavior.focusSelectedCluster
      && selectionControl.value !== undefined
      && selectionControl.value !== previousSelection
    ) {
      setCameraTransitioning(true);
    }
  }, [config.behavior.focusSelectedCluster, mode, selectionControl.value]);

  const previousScenarioKeyRef = useRef(runtimeScenarioKey);
  useEffect(() => {
    if (previousScenarioKeyRef.current !== runtimeScenarioKey) {
      previousScenarioKeyRef.current = runtimeScenarioKey;
      clearSelection();
      setCameraTransitioning(false);
    }
  }, [clearSelection, runtimeScenarioKey]);

  useEffect(() => {
    if (selectionControl.value && !focus.selectedClusterId) {
      clearSelection();
      setCameraTransitioning(false);
    }
  }, [clearSelection, focus.selectedClusterId, selectionControl.value]);

  return {
    config,
    focus,
    state: {
      mode,
      selectedClusterId: focus.selectedClusterId,
      isPaused: pauseControl.value,
      isCameraTransitioning,
      relatedClusterIds: focus.relatedClusterIds,
      relatedSynapseIds: focus.relatedSynapseIds,
      relatedPathwayIds: focus.relatedPathwayIds,
    },
    cameraResetRevision,
    clearSelection,
    enterInspection,
    exitInspection,
    handleKeyDown,
    resetView,
    selectCluster,
    setCameraTransitioning,
    togglePaused,
  };
};
