import type { NeuralCoreInspectionPickCandidate } from "./neural-core-inspection-focus.types";

export const isNeuralCoreInspectionPickCandidateBetter = (
  candidate: NeuralCoreInspectionPickCandidate,
  current?: NeuralCoreInspectionPickCandidate,
): boolean => {
  if (!current) {
    return true;
  }
  const rayDifference = candidate.distanceToRay - current.distanceToRay;
  if (Math.abs(rayDifference) > 0.000001) {
    return rayDifference < 0;
  }
  const cameraDifference = candidate.distanceToCamera - current.distanceToCamera;
  if (Math.abs(cameraDifference) > 0.000001) {
    return cameraDifference < 0;
  }
  const priorityDifference = candidate.priority - current.priority;
  return priorityDifference !== 0
    ? priorityDifference > 0
    : candidate.clusterId.localeCompare(current.clusterId) < 0;
};
