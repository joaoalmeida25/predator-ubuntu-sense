import { hashNeuralCoreTopologyVisualId } from "../topology/neural-core-topology-visual.utils";
import {
  DEFAULT_NEURAL_CORE_CLUSTER_GRAMMAR_CONFIG,
} from "./neural-core-cluster-grammar.constants";
import type {
  NeuralCoreClusterGrammarConfig,
  NeuralCoreClusterGrammarConfigInput,
} from "./neural-core-cluster-grammar.types";
import type { NeuralCoreVector3 } from "../graph/neural-core-graph.types";

const finiteInRange = (
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number => typeof value === "number" && Number.isFinite(value)
  ? Math.min(maximum, Math.max(minimum, value))
  : fallback;

const integerInRange = (
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number => Math.round(finiteInRange(value, fallback, minimum, maximum));

export const resolveNeuralCoreClusterGrammarConfig = (
  input?: NeuralCoreClusterGrammarConfigInput,
): NeuralCoreClusterGrammarConfig => {
  const defaults = DEFAULT_NEURAL_CORE_CLUSTER_GRAMMAR_CONFIG;
  return {
    enabled: input?.enabled ?? defaults.enabled,
    macro: {
      maximumVisibleTerritories: integerInRange(
        input?.macro?.maximumVisibleTerritories,
        defaults.macro.maximumVisibleTerritories,
        1,
        12,
      ),
      internalNodeSampleRatio: finiteInRange(
        input?.macro?.internalNodeSampleRatio,
        defaults.macro.internalNodeSampleRatio,
        0.02,
        0.35,
      ),
      internalConnectionSampleRatio: finiteInRange(
        input?.macro?.internalConnectionSampleRatio,
        defaults.macro.internalConnectionSampleRatio,
        0.01,
        0.3,
      ),
    },
    meso: {
      maximumRelatedTerritories: integerInRange(
        input?.meso?.maximumRelatedTerritories,
        defaults.meso.maximumRelatedTerritories,
        1,
        8,
      ),
      internalNodeVisibility: finiteInRange(
        input?.meso?.internalNodeVisibility,
        defaults.meso.internalNodeVisibility,
        0,
        1,
      ),
      internalConnectionVisibility: finiteInRange(
        input?.meso?.internalConnectionVisibility,
        defaults.meso.internalConnectionVisibility,
        0,
        1,
      ),
    },
    micro: {
      selectedInternalNodeVisibility: finiteInRange(
        input?.micro?.selectedInternalNodeVisibility,
        defaults.micro.selectedInternalNodeVisibility,
        0,
        1,
      ),
      selectedInternalConnectionVisibility: finiteInRange(
        input?.micro?.selectedInternalConnectionVisibility,
        defaults.micro.selectedInternalConnectionVisibility,
        0,
        1,
      ),
      relatedTerritoryOpacity: finiteInRange(
        input?.micro?.relatedTerritoryOpacity,
        defaults.micro.relatedTerritoryOpacity,
        0.05,
        1,
      ),
      contextTerritoryOpacity: finiteInRange(
        input?.micro?.contextTerritoryOpacity,
        defaults.micro.contextTerritoryOpacity,
        0.02,
        0.8,
      ),
    },
    routes: {
      maximumMacroRoutes: integerInRange(
        input?.routes?.maximumMacroRoutes,
        defaults.routes.maximumMacroRoutes,
        1,
        16,
      ),
      maximumMesoRoutes: integerInRange(
        input?.routes?.maximumMesoRoutes,
        defaults.routes.maximumMesoRoutes,
        1,
        24,
      ),
      minimumActivity: finiteInRange(
        input?.routes?.minimumActivity,
        defaults.routes.minimumActivity,
        0,
        1,
      ),
      protagonistPriority: finiteInRange(
        input?.routes?.protagonistPriority,
        defaults.routes.protagonistPriority,
        0,
        20,
      ),
      criticalPriority: finiteInRange(
        input?.routes?.criticalPriority,
        defaults.routes.criticalPriority,
        0,
        20,
      ),
      activePriority: finiteInRange(
        input?.routes?.activePriority,
        defaults.routes.activePriority,
        0,
        20,
      ),
      relatedPriority: finiteInRange(
        input?.routes?.relatedPriority,
        defaults.routes.relatedPriority,
        0,
        20,
      ),
      inactiveOpacity: finiteInRange(
        input?.routes?.inactiveOpacity,
        defaults.routes.inactiveOpacity,
        0,
        0.5,
      ),
    },
    transitionDamping: finiteInRange(
      input?.transitionDamping,
      defaults.transitionDamping,
      0.5,
      20,
    ),
  };
};

export const shouldIncludeNeuralCoreVisualSample = (
  id: string,
  ratio: number,
  seed = "cluster-grammar",
): boolean => {
  const clampedRatio = Math.min(1, Math.max(0, ratio));
  if (clampedRatio <= 0) {
    return false;
  }
  if (clampedRatio >= 1) {
    return true;
  }
  const normalizedHash = hashNeuralCoreTopologyVisualId(`${seed}:${id}`) / 4294967295;
  return normalizedHash < clampedRatio;
};

export const dampNeuralCoreClusterGrammarValue = (
  current: number,
  target: number,
  damping: number,
  deltaSeconds: number,
): number => target + (current - target)
  * Math.exp(-damping * Math.max(0, Math.min(0.1, deltaSeconds)));

export const getNeuralCoreClusterGrammarCurvePoint = (
  controlPoints: readonly NeuralCoreVector3[],
  progress: number,
  target: NeuralCoreVector3,
): void => {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const segmentCount = Math.max(1, controlPoints.length - 1);
  const scaled = clampedProgress * segmentCount;
  const segmentIndex = Math.min(segmentCount - 1, Math.floor(scaled));
  const amount = scaled - segmentIndex;
  const previous = controlPoints[Math.max(0, segmentIndex - 1)]
    ?? controlPoints[segmentIndex];
  const start = controlPoints[segmentIndex];
  const end = controlPoints[Math.min(controlPoints.length - 1, segmentIndex + 1)];
  const next = controlPoints[Math.min(controlPoints.length - 1, segmentIndex + 2)]
    ?? end;
  const amountSquared = amount * amount;
  const amountCubed = amountSquared * amount;
  for (let axis = 0; axis < 3; axis += 1) {
    target[axis] = 0.5 * (
      2 * start[axis]
      + (-previous[axis] + end[axis]) * amount
      + (2 * previous[axis] - 5 * start[axis] + 4 * end[axis] - next[axis])
        * amountSquared
      + (-previous[axis] + 3 * start[axis] - 3 * end[axis] + next[axis])
        * amountCubed
    );
  }
};

export const parseNeuralCoreClusterGrammarColor = (
  color: string,
): readonly [number, number, number] => {
  const packed = Number.parseInt(color.replace("#", ""), 16);
  const safe = Number.isFinite(packed) ? packed : 0x8ff4ff;
  return [
    ((safe >> 16) & 255) / 255,
    ((safe >> 8) & 255) / 255,
    (safe & 255) / 255,
  ];
};
