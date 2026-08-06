import type {
  NeuralCoreAggregatedPulseField,
  NeuralCoreAggregatedRouteRenderField,
  NeuralCoreClusterGrammarRuntime,
  NeuralCoreClusterGrammarState,
} from "./neural-core-cluster-grammar.types";
import {
  NEURAL_CORE_CLUSTER_GRAMMAR_PULSE_TRAIL_SAMPLES,
  NEURAL_CORE_CLUSTER_GRAMMAR_ROUTE_PULSES,
  NEURAL_CORE_CLUSTER_GRAMMAR_ROUTE_SEGMENTS,
} from "./neural-core-cluster-grammar.constants";
import {
  getNeuralCoreClusterGrammarCurvePoint,
  parseNeuralCoreClusterGrammarColor,
} from "./neural-core-cluster-grammar.utils";
import { hashNeuralCoreTopologyVisualId } from "../topology/neural-core-topology-visual.utils";
import type { NeuralCoreVector3 } from "../graph/neural-core-graph.types";

const writeRouteVertex = (
  field: NeuralCoreAggregatedRouteRenderField,
  vertexIndex: number,
  point: NeuralCoreVector3,
  center: NeuralCoreVector3,
  color: readonly [number, number, number],
  routeIndex: number,
): void => {
  const offset = vertexIndex * 3;
  field.positions[offset] = point[0];
  field.positions[offset + 1] = point[1];
  field.positions[offset + 2] = point[2];
  field.centerPositions[offset] = center[0];
  field.centerPositions[offset + 1] = center[1];
  field.centerPositions[offset + 2] = center[2];
  field.colors[offset] = color[0];
  field.colors[offset + 1] = color[1];
  field.colors[offset + 2] = color[2];
  field.routeIndices[vertexIndex] = routeIndex;
};

export const createNeuralCoreAggregatedRouteRenderField = (
  grammar: NeuralCoreClusterGrammarState,
): NeuralCoreAggregatedRouteRenderField => {
  const verticesPerRoute = NEURAL_CORE_CLUSTER_GRAMMAR_ROUTE_SEGMENTS * 6;
  const vertexCount = grammar.routes.length * verticesPerRoute;
  const field: NeuralCoreAggregatedRouteRenderField = {
    positions: new Float32Array(vertexCount * 3),
    centerPositions: new Float32Array(vertexCount * 3),
    colors: new Float32Array(vertexCount * 3),
    opacities: new Float32Array(vertexCount),
    thicknesses: new Float32Array(vertexCount).fill(1),
    routeIndices: new Uint16Array(vertexCount),
  };
  const previous: NeuralCoreVector3 = [0, 0, 0];
  const current: NeuralCoreVector3 = [0, 0, 0];
  const next: NeuralCoreVector3 = [0, 0, 0];
  grammar.routes.forEach((route, routeIndex): void => {
    const color = parseNeuralCoreClusterGrammarColor(route.color);
    const width = Math.min(0.018, 0.006 + route.communicationWeight * 0.0014);
    for (
      let segmentIndex = 0;
      segmentIndex < NEURAL_CORE_CLUSTER_GRAMMAR_ROUTE_SEGMENTS;
      segmentIndex += 1
    ) {
      const startProgress = segmentIndex / NEURAL_CORE_CLUSTER_GRAMMAR_ROUTE_SEGMENTS;
      const endProgress = (segmentIndex + 1) / NEURAL_CORE_CLUSTER_GRAMMAR_ROUTE_SEGMENTS;
      getNeuralCoreClusterGrammarCurvePoint(route.controlPoints, startProgress, current);
      getNeuralCoreClusterGrammarCurvePoint(route.controlPoints, endProgress, next);
      getNeuralCoreClusterGrammarCurvePoint(
        route.controlPoints,
        Math.max(0, startProgress - 0.01),
        previous,
      );
      const tangentX = next[0] - previous[0];
      const tangentY = next[1] - previous[1];
      const tangentLength = Math.hypot(tangentX, tangentY);
      const sideX = tangentLength <= 0.0001
        ? width
        : -tangentY / tangentLength * width;
      const sideY = tangentLength <= 0.0001
        ? 0
        : tangentX / tangentLength * width;
      const leftStart: NeuralCoreVector3 = [
        current[0] + sideX,
        current[1] + sideY,
        current[2],
      ];
      const rightStart: NeuralCoreVector3 = [
        current[0] - sideX,
        current[1] - sideY,
        current[2],
      ];
      const leftEnd: NeuralCoreVector3 = [
        next[0] + sideX,
        next[1] + sideY,
        next[2],
      ];
      const rightEnd: NeuralCoreVector3 = [
        next[0] - sideX,
        next[1] - sideY,
        next[2],
      ];
      const vertexIndex = routeIndex * verticesPerRoute + segmentIndex * 6;
      writeRouteVertex(field, vertexIndex, leftStart, current, color, routeIndex);
      writeRouteVertex(field, vertexIndex + 1, rightStart, current, color, routeIndex);
      writeRouteVertex(field, vertexIndex + 2, leftEnd, next, color, routeIndex);
      writeRouteVertex(field, vertexIndex + 3, rightStart, current, color, routeIndex);
      writeRouteVertex(field, vertexIndex + 4, rightEnd, next, color, routeIndex);
      writeRouteVertex(field, vertexIndex + 5, leftEnd, next, color, routeIndex);
    }
  });
  return field;
};

export const updateNeuralCoreAggregatedRouteRenderField = (
  field: NeuralCoreAggregatedRouteRenderField,
  runtime: NeuralCoreClusterGrammarRuntime,
  activeOperationalRouteIndex?: number,
  activeRouteOpacityMultiplier = 1,
  activeRouteThicknessMultiplier = 1,
): void => {
  const operationalOpacityMultiplier = Math.max(
    0,
    Math.min(1, activeRouteOpacityMultiplier),
  );
  const operationalThicknessMultiplier = Math.max(
    0,
    Math.min(1, activeRouteThicknessMultiplier),
  );
  for (let vertexIndex = 0; vertexIndex < field.opacities.length; vertexIndex += 1) {
    const routeIndex = field.routeIndices[vertexIndex];
    const routeState = runtime.routeStates[routeIndex];
    const isActiveOperationalRoute = routeIndex === activeOperationalRouteIndex;
    field.opacities[vertexIndex] = routeState.opacity
      * (isActiveOperationalRoute ? operationalOpacityMultiplier : 1);
    field.thicknesses[vertexIndex] = routeState.thickness
      * (isActiveOperationalRoute ? operationalThicknessMultiplier : 1);
  }
};

export const createNeuralCoreAggregatedPulseField = (
  grammar: NeuralCoreClusterGrammarState,
): NeuralCoreAggregatedPulseField => {
  const maximumPointCount = grammar.routes.length
    * NEURAL_CORE_CLUSTER_GRAMMAR_ROUTE_PULSES
    * NEURAL_CORE_CLUSTER_GRAMMAR_PULSE_TRAIL_SAMPLES;
  const routeColors = new Float32Array(grammar.routes.length * 3);
  grammar.routes.forEach((route, routeIndex): void => {
    const color = parseNeuralCoreClusterGrammarColor(route.color);
    const offset = routeIndex * 3;
    routeColors[offset] = color[0];
    routeColors[offset + 1] = color[1];
    routeColors[offset + 2] = color[2];
  });
  return {
    positions: new Float32Array(maximumPointCount * 3),
    colors: new Float32Array(maximumPointCount * 3),
    opacities: new Float32Array(maximumPointCount),
    sizes: new Float32Array(maximumPointCount),
    maximumPointCount,
    routeColors,
    scratchPoint: [0, 0, 0],
  };
};

export const updateNeuralCoreAggregatedPulseField = (
  field: NeuralCoreAggregatedPulseField,
  grammar: NeuralCoreClusterGrammarState,
  runtime: NeuralCoreClusterGrammarRuntime,
  elapsedSeconds: number,
  activeOperationalGeometryId?: string,
  backgroundPulseMultiplier = 1,
): number => {
  let pointIndex = 0;
  const point = field.scratchPoint;
  const pulseMultiplier = Math.max(0, Math.min(1, backgroundPulseMultiplier));
  for (let routeIndex = 0; routeIndex < grammar.routes.length; routeIndex += 1) {
    const route = grammar.routes[routeIndex];
    const state = runtime.routeStates[routeIndex];
    if (
      route.id === activeOperationalGeometryId
      || state.pulseOpacity * pulseMultiplier <= 0.002
    ) {
      continue;
    }
    const routeColorOffset = routeIndex * 3;
    const seed = hashNeuralCoreTopologyVisualId(route.id) / 4294967295;
    const speed = 0.07 + route.activity * 0.16 + state.emphasis * 0.08;
    for (
      let pulseIndex = 0;
      pulseIndex < NEURAL_CORE_CLUSTER_GRAMMAR_ROUTE_PULSES;
      pulseIndex += 1
    ) {
      const baseProgress = (
        elapsedSeconds * speed
        + seed
        + pulseIndex / NEURAL_CORE_CLUSTER_GRAMMAR_ROUTE_PULSES
      ) % 1;
      for (
        let trailIndex = 0;
        trailIndex < NEURAL_CORE_CLUSTER_GRAMMAR_PULSE_TRAIL_SAMPLES;
        trailIndex += 1
      ) {
        const reverseDirection = route.direction === "backward"
          || (route.direction === "bidirectional" && pulseIndex % 2 === 1);
        const directionProgress = reverseDirection
          ? 1 - baseProgress
          : baseProgress;
        const trailOffset = trailIndex * 0.018 * (reverseDirection ? -1 : 1);
        const progress = (directionProgress - trailOffset + 1) % 1;
        getNeuralCoreClusterGrammarCurvePoint(route.controlPoints, progress, point);
        const offset = pointIndex * 3;
        const trailWeight = 1 - trailIndex
          / NEURAL_CORE_CLUSTER_GRAMMAR_PULSE_TRAIL_SAMPLES;
        field.positions[offset] = point[0];
        field.positions[offset + 1] = point[1];
        field.positions[offset + 2] = point[2];
        field.colors[offset] = field.routeColors[routeColorOffset]
          * (0.84 + state.emphasis * 0.26);
        field.colors[offset + 1] = field.routeColors[routeColorOffset + 1]
          * (0.84 + state.emphasis * 0.26);
        field.colors[offset + 2] = field.routeColors[routeColorOffset + 2]
          * (0.84 + state.emphasis * 0.26);
        field.opacities[pointIndex] = state.pulseOpacity
          * pulseMultiplier
          * trailWeight;
        const roleScale = state.isProtagonist ? 1.2 : state.isRelated ? 1.08 : 1;
        field.sizes[pointIndex] = 0.032
          * (0.74 + state.emphasis * 0.38)
          * roleScale
          * trailWeight;
        pointIndex += 1;
      }
    }
  }
  return pointIndex;
};
