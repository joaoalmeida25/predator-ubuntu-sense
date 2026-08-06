import { useCallback, useRef } from "react";

import {
  createNeuralCorePropagationConfigKey,
} from "../../domain/propagation/neural-core-propagation.config";
import {
  advanceNeuralCorePropagation,
  createNeuralCorePropagationRuntime,
} from "../../domain/propagation/neural-core-propagation.engine";
import {
  createNeuralCorePropagationPlan,
  createNeuralCorePropagationPlanWithTransmission,
  createNeuralCoreTopologyKey,
} from "../../domain/propagation/neural-core-propagation.plan";
import type {
  NeuralCorePropagationConfig,
  NeuralCorePropagationPlan,
  NeuralCorePropagationRuntimeState,
} from "../../domain/propagation/neural-core-propagation.types";
import type {
  NeuralCoreTopology,
  NeuralCoreTransmission,
} from "../../domain/topology/neural-core-topology.types";
import { clampPropagationValue } from "../../domain/propagation/neural-core-propagation.utils";
import {
  createNeuralCorePropagationVisualRuntime,
  EMPTY_NEURAL_CORE_PROPAGATION_VISUAL_STATE,
  mapNeuralCorePropagationToVisualState,
} from "../../visualization/propagation/neural-core-propagation-visual.mapper";
import type { NeuralCorePropagationVisualState } from "../../visualization/propagation/neural-core-propagation-visual.types";
import type {
  NeuralCorePropagationProgressRef,
  UseNeuralCorePropagationParams,
  UseNeuralCorePropagationResult,
} from "./use-neural-core-propagation.types";

interface NeuralCorePropagationPlanCache {
  source?: NeuralCoreTopology;
  key: string;
  plan?: NeuralCorePropagationPlan;
}

interface NeuralCorePropagationConfigCache {
  source: NeuralCorePropagationConfig;
  key: string;
  value: NeuralCorePropagationConfig;
}

interface NeuralCoreExternalPropagationCache {
  basePlan?: NeuralCorePropagationPlan;
  transmission?: NeuralCoreTransmission;
  plan?: NeuralCorePropagationPlan;
}

const getExternalProgressDelta = (
  runtime: NeuralCorePropagationRuntimeState,
  transmission: NeuralCoreTransmission,
  progressRef: NeuralCorePropagationProgressRef,
): number => {
  let propagation: NeuralCorePropagationRuntimeState["activePropagations"][number]
  | undefined;
  for (const candidate of runtime.activePropagations) {
    if (candidate.transmissionId === transmission.id) {
      propagation = candidate;
      break;
    }
  }
  if (!propagation) {
    return 0;
  }
  const desiredProgress = clampPropagationValue(progressRef.current);
  return Math.max(0, desiredProgress - propagation.progress) * propagation.durationSeconds;
};

export const useNeuralCorePropagation = ({
  config,
  externalTransmission,
  externalProgressRef,
  onPropagationEvent,
  resetKey = "none",
  topology,
}: UseNeuralCorePropagationParams): UseNeuralCorePropagationResult => {
  const callbackRef = useRef(onPropagationEvent);
  callbackRef.current = onPropagationEvent;
  const externalProgressRefRef = useRef(externalProgressRef);
  externalProgressRefRef.current = externalProgressRef;

  const planCacheRef = useRef<NeuralCorePropagationPlanCache>({
    key: "uninitialized",
  });
  if (planCacheRef.current.source !== topology) {
    const key = topology ? createNeuralCoreTopologyKey(topology) : "none";
    planCacheRef.current = key === planCacheRef.current.key
      ? { ...planCacheRef.current, source: topology }
      : {
        source: topology,
        key,
        plan: topology ? createNeuralCorePropagationPlan(topology) : undefined,
      };
  }

  const configCacheRef = useRef<NeuralCorePropagationConfigCache>({
    source: config,
    key: createNeuralCorePropagationConfigKey(config),
    value: config,
  });
  if (configCacheRef.current.source !== config) {
    const key = createNeuralCorePropagationConfigKey(config);
    configCacheRef.current = key === configCacheRef.current.key
      ? { ...configCacheRef.current, source: config }
      : { source: config, key, value: config };
  }

  const basePlan = planCacheRef.current.plan;
  const externalPlanCacheRef = useRef<NeuralCoreExternalPropagationCache>({});
  if (
    externalPlanCacheRef.current.basePlan !== basePlan
    || externalPlanCacheRef.current.transmission !== externalTransmission
  ) {
    externalPlanCacheRef.current = {
      basePlan,
      transmission: externalTransmission,
      plan: basePlan && externalTransmission
        ? createNeuralCorePropagationPlanWithTransmission(basePlan, externalTransmission)
        : basePlan,
    };
  }
  const effectivePlan = externalPlanCacheRef.current.plan;
  const stableConfig = configCacheRef.current.value;
  const visualRuntimeCacheRef = useRef<{
    plan?: NeuralCorePropagationPlan;
    config?: NeuralCorePropagationConfig;
    value?: ReturnType<typeof createNeuralCorePropagationVisualRuntime>;
  }>({});
  if (
    visualRuntimeCacheRef.current.plan !== effectivePlan
    || visualRuntimeCacheRef.current.config !== stableConfig
  ) {
    visualRuntimeCacheRef.current = {
      plan: effectivePlan,
      config: stableConfig,
      value: effectivePlan
        ? createNeuralCorePropagationVisualRuntime(effectivePlan, stableConfig)
        : undefined,
    };
  }

  const runtimeRef = useRef<NeuralCorePropagationRuntimeState | null>(null);
  const runtimeIdentityRef = useRef<{
    resetKey: string;
    plan?: NeuralCorePropagationPlan;
    config?: NeuralCorePropagationConfig;
  }>({ resetKey: "uninitialized" });
  if (
    !runtimeRef.current
    || runtimeIdentityRef.current.resetKey !== resetKey
    || runtimeIdentityRef.current.plan !== effectivePlan
    || runtimeIdentityRef.current.config !== stableConfig
  ) {
    runtimeIdentityRef.current = { resetKey, plan: effectivePlan, config: stableConfig };
    runtimeRef.current = createNeuralCorePropagationRuntime({
      plan: effectivePlan,
      config: stableConfig,
    });
  }

  const reset = useCallback((): void => {
    const plan = externalPlanCacheRef.current.plan;
    const stableConfigValue = configCacheRef.current.value;
    runtimeRef.current = createNeuralCorePropagationRuntime({
      plan,
      config: stableConfigValue,
    });
  }, []);

  const advance = useCallback((deltaSeconds: number): NeuralCorePropagationVisualState => {
    const currentPlan = externalPlanCacheRef.current.plan;
    const currentVisualRuntime = visualRuntimeCacheRef.current.value;
    if (!currentPlan || !currentVisualRuntime) {
      return EMPTY_NEURAL_CORE_PROPAGATION_VISUAL_STATE;
    }
    const currentRuntime = runtimeRef.current ?? createNeuralCorePropagationRuntime({
      plan: currentPlan,
      config: configCacheRef.current.value,
    });
    const activeTransmission = externalPlanCacheRef.current.transmission;
    const progressValueRef = externalProgressRefRef.current;
    const effectiveDeltaSeconds = activeTransmission && progressValueRef
      ? getExternalProgressDelta(currentRuntime, activeTransmission, progressValueRef)
      : deltaSeconds;
    const step = advanceNeuralCorePropagation({
      runtime: currentRuntime,
      plan: currentPlan,
      deltaSeconds: effectiveDeltaSeconds,
      config: configCacheRef.current.value,
    });
    runtimeRef.current = step.runtime;
    if (callbackRef.current) {
      for (const event of step.events) {
        callbackRef.current(event);
      }
    }
    return mapNeuralCorePropagationToVisualState({
      runtime: step.runtime,
      plan: currentPlan,
      config: configCacheRef.current.value,
      visualRuntime: currentVisualRuntime,
    });
  }, []);

  return {
    advance,
    config: stableConfig,
    plan: basePlan,
    reset,
  };
};
