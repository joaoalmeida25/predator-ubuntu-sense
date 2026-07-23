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
  createNeuralCoreTopologyKey,
} from "../../domain/propagation/neural-core-propagation.plan";
import type {
  NeuralCorePropagationPlan,
  NeuralCorePropagationRuntimeState,
} from "../../domain/propagation/neural-core-propagation.types";
import {
  createNeuralCorePropagationVisualRuntime,
  EMPTY_NEURAL_CORE_PROPAGATION_VISUAL_STATE,
  mapNeuralCorePropagationToVisualState,
} from "../../visualization/propagation/neural-core-propagation-visual.mapper";
import type { NeuralCorePropagationVisualState } from "../../visualization/propagation/neural-core-propagation-visual.types";
import type {
  UseNeuralCorePropagationParams,
  UseNeuralCorePropagationResult,
} from "./use-neural-core-propagation.types";

export const useNeuralCorePropagation = ({
  config,
  onPropagationEvent,
  resetKey = "none",
  topology,
}: UseNeuralCorePropagationParams): UseNeuralCorePropagationResult => {
  const callbackRef = useRef(onPropagationEvent);
  callbackRef.current = onPropagationEvent;

  const topologyKey = topology ? createNeuralCoreTopologyKey(topology) : "none";
  const planCacheRef = useRef<{ key: string; plan?: NeuralCorePropagationPlan }>({
    key: "uninitialized",
  });
  if (planCacheRef.current.key !== topologyKey) {
    planCacheRef.current = {
      key: topologyKey,
      plan: topology ? createNeuralCorePropagationPlan(topology) : undefined,
    };
  }

  const configKey = createNeuralCorePropagationConfigKey(config);
  const configCacheRef = useRef({ key: configKey, value: config });
  if (configCacheRef.current.key !== configKey) {
    configCacheRef.current = { key: configKey, value: config };
  }

  const plan = planCacheRef.current.plan;
  const stableConfig = configCacheRef.current.value;
  const visualRuntimeKey = `${topologyKey}:${configKey}`;
  const visualRuntimeCacheRef = useRef<{
    key: string;
    value?: ReturnType<typeof createNeuralCorePropagationVisualRuntime>;
  }>({ key: "uninitialized" });
  if (visualRuntimeCacheRef.current.key !== visualRuntimeKey) {
    visualRuntimeCacheRef.current = {
      key: visualRuntimeKey,
      value: plan
        ? createNeuralCorePropagationVisualRuntime(plan, stableConfig)
        : undefined,
    };
  }
  const identityKey = `${resetKey}:${topologyKey}:${configKey}`;
  const runtimeRef = useRef<NeuralCorePropagationRuntimeState | null>(null);
  if (!runtimeRef.current) {
    runtimeRef.current = createNeuralCorePropagationRuntime({ plan, config: stableConfig });
  }
  const runtimeIdentityRef = useRef(identityKey);
  if (runtimeIdentityRef.current !== identityKey) {
    runtimeIdentityRef.current = identityKey;
    runtimeRef.current = createNeuralCorePropagationRuntime({ plan, config: stableConfig });
  }

  const reset = useCallback((): void => {
    runtimeRef.current = createNeuralCorePropagationRuntime({
      plan: planCacheRef.current.plan,
      config: configCacheRef.current.value,
    });
  }, []);

  const advance = useCallback((deltaSeconds: number): NeuralCorePropagationVisualState => {
    const currentPlan = planCacheRef.current.plan;
    const currentVisualRuntime = visualRuntimeCacheRef.current.value;
    if (!currentPlan || !currentVisualRuntime) {
      return EMPTY_NEURAL_CORE_PROPAGATION_VISUAL_STATE;
    }
    const step = advanceNeuralCorePropagation({
      runtime: runtimeRef.current ?? createNeuralCorePropagationRuntime({
        plan: currentPlan,
        config: configCacheRef.current.value,
      }),
      plan: currentPlan,
      deltaSeconds,
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

  return { advance, config: stableConfig, plan, reset };
};
