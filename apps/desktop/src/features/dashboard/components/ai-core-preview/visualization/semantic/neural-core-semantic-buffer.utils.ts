import type { NeuralCoreTopology } from "../../domain/topology/neural-core-topology.types";
import type {
  NeuralCoreConnectionBuffer,
  NeuralCoreGraph,
  NeuralCoreNodeKind,
  NeuralCoreVector3,
} from "../graph/neural-core-graph.types";
import { hashNeuralCoreTopologyVisualId } from "../topology/neural-core-topology-visual.utils";
import type {
  NeuralCoreSynapseVisualRoute,
  NeuralCoreTopologyVisualState,
} from "../topology/neural-core-topology-visual.types";
import { dampNeuralCoreValue } from "./neural-core-semantic-transition.utils";
import type {
  NeuralCoreSemanticBufferState,
  NeuralCoreSemanticBufferUpdateResult,
  NeuralCoreSemanticConnectionField,
  NeuralCoreSemanticNodeField,
  NeuralCoreSemanticPointCloudField,
  NeuralCoreSemanticRibbonField,
  NeuralCoreSemanticRibbonPathwayContribution,
  NeuralCoreSemanticRibbonSpan,
} from "./neural-core-semantic-buffer.types";
import type {
  NeuralCoreClusterSemanticVisualState,
  NeuralCorePathwaySemanticVisualState,
  NeuralCoreNodeVisualEmphasis,
  NeuralCoreSemanticVisualizationConfig,
  NeuralCoreSemanticVisualState,
} from "./neural-core-semantic-visual.types";
import type {
  NeuralCoreSceneDirectionConfig,
  NeuralCoreSceneDirectionState,
} from "../direction/neural-core-scene-direction.types";
import type { NeuralCoreNarrativeVisualState } from "../narrative/neural-core-narrative-visual.types";
import type { NeuralCoreInspectionVisibilityState } from "../inspection/neural-core-inspection-visibility.types";
import {
  resolveNeuralCoreInspectionVisibilityRole,
} from "../inspection/neural-core-inspection-visibility.utils";
import type { NeuralCoreCameraRenderingProfile } from "../inspection/neural-core-camera-rendering.types";
import type { NeuralCoreElementVisualComposition } from "../inspection/neural-core-element-visual-composition.types";
import { writeNeuralCoreElementVisualComposition } from "../inspection/neural-core-element-visual-composition.utils";

interface SemanticRibbonSegment {
  baseOpacity: number;
  end: NeuralCoreVector3;
  pathwayContributions: readonly NeuralCoreSemanticRibbonPathwayContribution[];
  routeSeed: number;
  segmentCount: number;
  segmentIndex: number;
  semanticId: string;
  start: NeuralCoreVector3;
  synapseEffectIndex: number;
}

const SEMANTIC_VISUAL_COMPOSITION: NeuralCoreElementVisualComposition = {
  opacity: 1,
  brightness: 1,
  scale: 1,
  thickness: 1,
};

const clamp = (value: number, minimum = 0, maximum = 1): number => {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));
};

const smoothStep = (minimum: number, maximum: number, value: number): number => {
  if (maximum <= minimum) {
    return value >= maximum ? 1 : 0;
  }
  const amount = clamp((value - minimum) / (maximum - minimum));
  return amount * amount * (3 - 2 * amount);
};

const parseHexColor = (hex: string): number => {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return Number.isFinite(value) ? value : 0x80efff;
};

const writePackedColor = (
  array: Float32Array,
  colorIndex: number,
  packedColor: number,
): void => {
  const offset = colorIndex * 3;
  array[offset] = ((packedColor >> 16) & 255) / 255;
  array[offset + 1] = ((packedColor >> 8) & 255) / 255;
  array[offset + 2] = (packedColor & 255) / 255;
};

const convertSrgbChannelToLinear = (channel: number): number => {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
};

const writePackedLinearColor = (
  array: Float32Array,
  colorIndex: number,
  packedColor: number,
): void => {
  const offset = colorIndex * 3;
  array[offset] = convertSrgbChannelToLinear(((packedColor >> 16) & 255) / 255);
  array[offset + 1] = convertSrgbChannelToLinear(((packedColor >> 8) & 255) / 255);
  array[offset + 2] = convertSrgbChannelToLinear((packedColor & 255) / 255);
};

const getRoutePoint = (
  route: NeuralCoreSynapseVisualRoute,
  progress: number,
): NeuralCoreVector3 => {
  const amount = clamp(progress);
  const inverse = 1 - amount;
  const control = route.controlPoints[0] ?? [
    (route.start[0] + route.end[0]) * 0.5,
    (route.start[1] + route.end[1]) * 0.5,
    (route.start[2] + route.end[2]) * 0.5,
  ];

  return [
    inverse * inverse * route.start[0]
      + 2 * inverse * amount * control[0]
      + amount * amount * route.end[0],
    inverse * inverse * route.start[1]
      + 2 * inverse * amount * control[1]
      + amount * amount * route.end[1],
    inverse * inverse * route.start[2]
      + 2 * inverse * amount * control[2]
      + amount * amount * route.end[2],
  ];
};

const getDistance = (from: NeuralCoreVector3, to: NeuralCoreVector3): number => {
  return Math.hypot(from[0] - to[0], from[1] - to[1], from[2] - to[2]);
};

const createSynapseSegments = (
  route: NeuralCoreSynapseVisualRoute,
  segmentLength: number,
  synapseEffectIndex: number,
  pathwayContributions: readonly NeuralCoreSemanticRibbonPathwayContribution[],
): SemanticRibbonSegment[] => {
  const approximateLength = getDistance(route.start, route.end) * 1.18;
  const segmentCount = Math.min(24, Math.max(4, Math.ceil(approximateLength / segmentLength)));
  const routeSeed = hashNeuralCoreTopologyVisualId(route.synapseId) / 4294967295;

  return Array.from({ length: segmentCount }, (_, segmentIndex) => ({
    baseOpacity: 0,
    end: getRoutePoint(route, (segmentIndex + 1) / segmentCount),
    pathwayContributions,
    routeSeed,
    semanticId: route.synapseId,
    segmentCount,
    segmentIndex,
    start: getRoutePoint(route, segmentIndex / segmentCount),
    synapseEffectIndex,
  }));
};

const writeVector = (array: Float32Array, index: number, vector: NeuralCoreVector3): void => {
  const offset = index * 3;
  array[offset] = vector[0];
  array[offset + 1] = vector[1];
  array[offset + 2] = vector[2];
};

const copyRibbonScalarSpan = (
  source: Float32Array,
  target: Float32Array,
  sourceStart: number,
  sourceEnd: number,
  targetStart: number,
): void => {
  target.set(source.subarray(sourceStart, sourceEnd), targetStart);
};

const copyRibbonVectorSpan = (
  source: Float32Array,
  target: Float32Array,
  sourceStart: number,
  sourceEnd: number,
  targetStart: number,
): void => {
  target.set(
    source.subarray(sourceStart * 3, sourceEnd * 3),
    targetStart * 3,
  );
};

const copyOutgoingRibbonSpan = (
  source: NeuralCoreSemanticRibbonField,
  target: NeuralCoreSemanticRibbonField,
  span: NeuralCoreSemanticRibbonSpan,
  targetStart: number,
): void => {
  const sourceStart = span.startVertexIndex;
  const sourceEnd = sourceStart + span.vertexCount;
  copyRibbonVectorSpan(source.positions, target.positions, sourceStart, sourceEnd, targetStart);
  copyRibbonVectorSpan(
    source.otherPositions,
    target.otherPositions,
    sourceStart,
    sourceEnd,
    targetStart,
  );
  copyRibbonVectorSpan(source.colors, target.colors, sourceStart, sourceEnd, targetStart);
  copyRibbonVectorSpan(source.colors, target.targets.colors, sourceStart, sourceEnd, targetStart);
  copyRibbonScalarSpan(source.sides, target.sides, sourceStart, sourceEnd, targetStart);
  copyRibbonScalarSpan(
    source.routeSeeds,
    target.routeSeeds,
    sourceStart,
    sourceEnd,
    targetStart,
  );
  copyRibbonScalarSpan(
    source.routeProgresses,
    target.routeProgresses,
    sourceStart,
    sourceEnd,
    targetStart,
  );
  copyRibbonScalarSpan(source.opacities, target.opacities, sourceStart, sourceEnd, targetStart);
  copyRibbonScalarSpan(source.opacities, target.targets.opacities, sourceStart, sourceEnd, targetStart);
  copyRibbonScalarSpan(
    source.thicknesses,
    target.thicknesses,
    sourceStart,
    sourceEnd,
    targetStart,
  );
  copyRibbonScalarSpan(
    source.thicknesses,
    target.targets.thicknesses,
    sourceStart,
    sourceEnd,
    targetStart,
  );
  copyRibbonScalarSpan(
    source.fragmentations,
    target.fragmentations,
    sourceStart,
    sourceEnd,
    targetStart,
  );
  copyRibbonScalarSpan(
    source.fragmentations,
    target.targets.fragmentations,
    sourceStart,
    sourceEnd,
    targetStart,
  );
  copyRibbonScalarSpan(
    source.instabilities,
    target.instabilities,
    sourceStart,
    sourceEnd,
    targetStart,
  );
  copyRibbonScalarSpan(
    source.instabilities,
    target.targets.instabilities,
    sourceStart,
    sourceEnd,
    targetStart,
  );
  copyRibbonScalarSpan(
    source.interruptions,
    target.interruptions,
    sourceStart,
    sourceEnd,
    targetStart,
  );
  copyRibbonScalarSpan(
    source.interruptions,
    target.targets.interruptions,
    sourceStart,
    sourceEnd,
    targetStart,
  );
  copyRibbonScalarSpan(
    source.pulseFrequencies,
    target.pulseFrequencies,
    sourceStart,
    sourceEnd,
    targetStart,
  );
  copyRibbonScalarSpan(
    source.pulseFrequencies,
    target.targets.pulseFrequencies,
    sourceStart,
    sourceEnd,
    targetStart,
  );
  copyRibbonScalarSpan(
    source.pulseIntensities,
    target.pulseIntensities,
    sourceStart,
    sourceEnd,
    targetStart,
  );
  copyRibbonScalarSpan(
    source.pulseIntensities,
    target.targets.pulseIntensities,
    sourceStart,
    sourceEnd,
    targetStart,
  );
};

const createRibbonField = (
  segments: readonly SemanticRibbonSegment[],
  config: NeuralCoreSemanticVisualizationConfig,
  previousField?: NeuralCoreSemanticRibbonField,
): NeuralCoreSemanticRibbonField => {
  let hasCurrentPreviousSpans = false;
  for (const span of previousField?.spans ?? []) {
    if (!span.releasing) {
      hasCurrentPreviousSpans = true;
      break;
    }
  }
  const outgoingSpans = (previousField?.spans ?? []).filter((span) => {
    return hasCurrentPreviousSpans ? !span.releasing : span.releasing;
  });
  let outgoingVertexCount = 0;
  for (const span of outgoingSpans) {
    outgoingVertexCount += span.vertexCount;
  }
  const vertexCount = outgoingVertexCount + segments.length * 6;
  const colors = new Float32Array(vertexCount * 3);
  const opacities = new Float32Array(vertexCount);
  const thicknesses = new Float32Array(vertexCount);
  const targets = {
    colors: new Float32Array(vertexCount * 3),
    fragmentations: new Float32Array(vertexCount),
    instabilities: new Float32Array(vertexCount),
    interruptions: new Float32Array(vertexCount),
    opacities: new Float32Array(vertexCount),
    pulseFrequencies: new Float32Array(vertexCount),
    pulseIntensities: new Float32Array(vertexCount),
    thicknesses: new Float32Array(vertexCount),
  };
  const field: NeuralCoreSemanticRibbonField = {
    colors,
    fragmentations: new Float32Array(vertexCount),
    instabilities: new Float32Array(vertexCount),
    interruptions: new Float32Array(vertexCount),
    opacities,
    otherPositions: new Float32Array(vertexCount * 3),
    positions: new Float32Array(vertexCount * 3),
    routeProgresses: new Float32Array(vertexCount),
    routeSeeds: new Float32Array(vertexCount),
    sides: new Float32Array(vertexCount),
    spans: [],
    targets,
    pulseFrequencies: new Float32Array(vertexCount),
    pulseIntensities: new Float32Array(vertexCount),
    thicknesses,
  };
  const spans: NeuralCoreSemanticRibbonSpan[] = [];
  const startSides = [-1, 1, 1, -1, 1, -1];
  const usesStart = [true, true, false, true, false, false];
  const neutralColor = parseHexColor(config.color.neutral);

  let outgoingVertexIndex = 0;
  if (previousField) {
    for (const previousSpan of outgoingSpans) {
      copyOutgoingRibbonSpan(
        previousField,
        field,
        previousSpan,
        outgoingVertexIndex,
      );
      spans.push({
        ...previousSpan,
        releasing: true,
        startVertexIndex: outgoingVertexIndex,
      });
      outgoingVertexIndex += previousSpan.vertexCount;
    }
  }

  segments.forEach((segment, segmentBufferIndex): void => {
    const startVertexIndex = outgoingVertexCount + segmentBufferIndex * 6;
    for (let localIndex = 0; localIndex < 6; localIndex += 1) {
      const vertexIndex = startVertexIndex + localIndex;
      const useStart = usesStart[localIndex];
      writeVector(field.positions, vertexIndex, useStart ? segment.start : segment.end);
      writeVector(field.otherPositions, vertexIndex, useStart ? segment.end : segment.start);
      field.sides[vertexIndex] = startSides[localIndex];
      field.routeSeeds[vertexIndex] = segment.routeSeed;
      field.routeProgresses[vertexIndex] = (
        segment.segmentIndex + (useStart ? 0 : 1)
      ) / segment.segmentCount;
      field.thicknesses[vertexIndex] = config.synapse.minimumThickness;
      field.targets.thicknesses[vertexIndex] = config.synapse.minimumThickness;
      writePackedColor(field.colors, vertexIndex, neutralColor);
      writePackedColor(field.targets.colors, vertexIndex, neutralColor);
    }
    spans.push({
      baseOpacity: segment.baseOpacity,
      kind: "synapse",
      pathwayContributions: segment.pathwayContributions,
      releasing: false,
      routeSeed: segment.routeSeed,
      segmentCount: segment.segmentCount,
      segmentIndex: segment.segmentIndex,
      semanticId: segment.semanticId,
      startVertexIndex,
      synapseEffectIndex: segment.synapseEffectIndex,
      vertexCount: 6,
    });
  });

  return { ...field, spans };
};

const createNodeField = (
  graph: NeuralCoreGraph,
  config: NeuralCoreSemanticVisualizationConfig,
): NeuralCoreSemanticNodeField => {
  const maximumPointCount = graph.nodes.length;
  const field: NeuralCoreSemanticNodeField = {
    brightnesses: new Float32Array(maximumPointCount),
    colorInfluences: new Float32Array(maximumPointCount),
    colors: new Float32Array(maximumPointCount * 3),
    decays: new Float32Array(maximumPointCount),
    fills: new Float32Array(maximumPointCount),
    fragmentations: new Float32Array(maximumPointCount),
    jitters: new Float32Array(maximumPointCount),
    maximumPointCount,
    opacities: new Float32Array(maximumPointCount),
    pulseAmplitudes: new Float32Array(maximumPointCount),
    pulseFrequencies: new Float32Array(maximumPointCount),
    scales: new Float32Array(maximumPointCount),
    seeds: new Float32Array(maximumPointCount),
    synchronizations: new Float32Array(maximumPointCount),
    targets: {
      brightnesses: new Float32Array(maximumPointCount),
      colorInfluences: new Float32Array(maximumPointCount),
      colors: new Float32Array(maximumPointCount * 3),
      decays: new Float32Array(maximumPointCount),
      fills: new Float32Array(maximumPointCount),
      fragmentations: new Float32Array(maximumPointCount),
      jitters: new Float32Array(maximumPointCount),
      opacities: new Float32Array(maximumPointCount),
      pulseAmplitudes: new Float32Array(maximumPointCount),
      pulseFrequencies: new Float32Array(maximumPointCount),
      scales: new Float32Array(maximumPointCount),
      synchronizations: new Float32Array(maximumPointCount),
    },
  };
  const neutralColor = parseHexColor(config.color.neutral);

  field.opacities.fill(1);
  field.brightnesses.fill(1);
  field.scales.fill(1);
  field.targets.opacities.fill(1);
  field.targets.brightnesses.fill(1);
  field.targets.scales.fill(1);
  graph.nodes.forEach((node, index): void => {
    field.seeds[index] = hashNeuralCoreTopologyVisualId(`node:${node.id}`) / 4294967295;
    writePackedColor(field.colors, index, neutralColor);
    writePackedColor(field.targets.colors, index, neutralColor);
  });

  return field;
};

const createNodeBufferIndexById = (graph: NeuralCoreGraph): Int32Array => {
  let maximumNodeId = 0;
  for (const node of graph.nodes) {
    maximumNodeId = Math.max(maximumNodeId, node.id);
  }
  const lookup = new Int32Array(maximumNodeId + 1);
  lookup.fill(-1);
  graph.nodes.forEach((node, index): void => {
    lookup[node.id] = index;
  });
  return lookup;
};

const createNodeMembership = (
  nodeCount: number,
  nodeBufferIndexById: Int32Array,
  topologyVisualState: NeuralCoreTopologyVisualState,
): number[][] => {
  const memberships = Array.from({ length: nodeCount }, (): number[] => []);

  topologyVisualState.clusterRegions.forEach((region, effectIndex): void => {
    for (const nodeId of region.nodeIndices) {
      const nodeIndex = nodeId < nodeBufferIndexById.length
        ? nodeBufferIndexById[nodeId]
        : -1;
      if (nodeIndex >= 0) {
        memberships[nodeIndex].push(effectIndex);
      }
    }
    for (const nodeId of region.hubIndices) {
      const nodeIndex = nodeId < nodeBufferIndexById.length
        ? nodeBufferIndexById[nodeId]
        : -1;
      if (nodeIndex >= 0) {
        memberships[nodeIndex].push(effectIndex);
      }
    }
  });

  return memberships;
};

const createPointCloudFields = (
  graph: NeuralCoreGraph,
): NeuralCoreSemanticPointCloudField[] => {
  return graph.nodeClouds.map((cloud): NeuralCoreSemanticPointCloudField => {
    const pointCount = cloud.nodeIds.length;
    const field: NeuralCoreSemanticPointCloudField = {
      brightnesses: new Float32Array(pointCount),
      colorInfluences: new Float32Array(pointCount),
      colors: new Float32Array(pointCount * 3),
      decays: new Float32Array(pointCount),
      fills: new Float32Array(pointCount),
      fragmentations: new Float32Array(pointCount),
      jitters: new Float32Array(pointCount),
      opacities: new Float32Array(pointCount),
      pulseAmplitudes: new Float32Array(pointCount),
      pulseFrequencies: new Float32Array(pointCount),
      scales: new Float32Array(pointCount),
      seeds: new Float32Array(pointCount),
      synchronizations: new Float32Array(pointCount),
    };
    field.opacities.fill(1);
    field.brightnesses.fill(1);
    field.scales.fill(1);
    return field;
  });
};

const createClusterMembershipMasks = (
  nodeCount: number,
  nodeBufferIndexById: Int32Array,
  topologyVisualState: NeuralCoreTopologyVisualState,
): Uint8Array[] => {
  return topologyVisualState.clusterRegions.map((region): Uint8Array => {
    const mask = new Uint8Array(nodeCount);
    for (const nodeId of region.nodeIndices) {
      const index = nodeId < nodeBufferIndexById.length ? nodeBufferIndexById[nodeId] : -1;
      if (index >= 0) {
        mask[index] = 1;
      }
    }
    for (const nodeId of region.hubIndices) {
      const index = nodeId < nodeBufferIndexById.length ? nodeBufferIndexById[nodeId] : -1;
      if (index >= 0) {
        mask[index] = 1;
      }
    }
    return mask;
  });
};

const createConnectionField = (
  buffer: NeuralCoreConnectionBuffer,
  nodeBufferIndexById: Int32Array,
  clusterMembershipMasks: readonly Uint8Array[],
): NeuralCoreSemanticConnectionField => {
  const connectionCount = buffer.connectionIds.length;
  const vertexCount = connectionCount * 2;
  const baseColor = parseHexColor(buffer.color);
  const field: NeuralCoreSemanticConnectionField = {
    baseColors: new Float32Array(vertexCount * 3),
    baseOpacities: new Float32Array(vertexCount),
    clusterEffectIndicesByConnection: [],
    colors: new Float32Array(vertexCount * 3),
    opacities: new Float32Array(vertexCount),
    semanticConnectionIndices: [],
    targetColors: new Float32Array(vertexCount * 3),
    targetOpacities: new Float32Array(vertexCount),
  };
  const memberships: number[][] = [];
  const semanticConnectionIndices: number[] = [];

  for (let connectionIndex = 0; connectionIndex < connectionCount; connectionIndex += 1) {
    const fromNodeId = buffer.fromNodeIds[connectionIndex];
    const toNodeId = buffer.toNodeIds[connectionIndex];
    const fromIndex = fromNodeId < nodeBufferIndexById.length
      ? nodeBufferIndexById[fromNodeId]
      : -1;
    const toIndex = toNodeId < nodeBufferIndexById.length
      ? nodeBufferIndexById[toNodeId]
      : -1;
    const clusterEffectIndices: number[] = [];
    if (fromIndex >= 0 && toIndex >= 0) {
      clusterMembershipMasks.forEach((mask, effectIndex): void => {
        if (mask[fromIndex] === 1 && mask[toIndex] === 1) {
          clusterEffectIndices.push(effectIndex);
        }
      });
    }
    memberships.push(clusterEffectIndices);
    if (clusterEffectIndices.length > 0) {
      semanticConnectionIndices.push(connectionIndex);
    }
    for (let endpointIndex = 0; endpointIndex < 2; endpointIndex += 1) {
      const vertexIndex = connectionIndex * 2 + endpointIndex;
      writePackedLinearColor(field.baseColors, vertexIndex, baseColor);
      field.baseOpacities[vertexIndex] = buffer.opacity;
    }
  }
  field.colors.set(field.baseColors);
  field.targetColors.set(field.baseColors);
  field.opacities.set(field.baseOpacities);
  field.targetOpacities.set(field.baseOpacities);

  return {
    ...field,
    clusterEffectIndicesByConnection: memberships,
    semanticConnectionIndices,
  };
};

const copyNodeFieldCurrent = (
  source: NeuralCoreSemanticNodeField | undefined,
  target: NeuralCoreSemanticNodeField,
): void => {
  if (!source || source.maximumPointCount !== target.maximumPointCount) {
    return;
  }
  target.brightnesses.set(source.brightnesses);
  target.colorInfluences.set(source.colorInfluences);
  target.colors.set(source.colors);
  target.decays.set(source.decays);
  target.fills.set(source.fills);
  target.fragmentations.set(source.fragmentations);
  target.jitters.set(source.jitters);
  target.opacities.set(source.opacities);
  target.pulseAmplitudes.set(source.pulseAmplitudes);
  target.pulseFrequencies.set(source.pulseFrequencies);
  target.scales.set(source.scales);
  target.synchronizations.set(source.synchronizations);
};

const copyConnectionFieldsCurrent = (
  source: readonly NeuralCoreSemanticConnectionField[] | undefined,
  target: readonly NeuralCoreSemanticConnectionField[],
): void => {
  if (!source || source.length !== target.length) {
    return;
  }
  target.forEach((field, index): void => {
    const previous = source[index];
    if (previous.colors.length === field.colors.length) {
      field.colors.set(previous.colors);
      field.opacities.set(previous.opacities);
    }
  });
};

const synchronizePointCloudFields = (
  buffers: NeuralCoreSemanticBufferState,
  graph: NeuralCoreGraph,
): void => {
  graph.nodeClouds.forEach((cloud, cloudIndex): void => {
    const field = buffers.pointCloudFields[cloudIndex];
    for (let pointIndex = 0; pointIndex < cloud.nodeIds.length; pointIndex += 1) {
      const nodeId = cloud.nodeIds[pointIndex];
      const nodeIndex = nodeId < buffers.nodeBufferIndexById.length
        ? buffers.nodeBufferIndexById[nodeId]
        : -1;
      if (nodeIndex < 0) {
        continue;
      }
      const sourceColorOffset = nodeIndex * 3;
      const targetColorOffset = pointIndex * 3;
      field.colors[targetColorOffset] = buffers.nodeField.colors[sourceColorOffset];
      field.colors[targetColorOffset + 1] = buffers.nodeField.colors[sourceColorOffset + 1];
      field.colors[targetColorOffset + 2] = buffers.nodeField.colors[sourceColorOffset + 2];
      field.brightnesses[pointIndex] = buffers.nodeField.brightnesses[nodeIndex];
      field.colorInfluences[pointIndex] = buffers.nodeField.colorInfluences[nodeIndex];
      field.decays[pointIndex] = buffers.nodeField.decays[nodeIndex];
      field.fills[pointIndex] = buffers.nodeField.fills[nodeIndex];
      field.fragmentations[pointIndex] = buffers.nodeField.fragmentations[nodeIndex];
      field.jitters[pointIndex] = buffers.nodeField.jitters[nodeIndex];
      field.opacities[pointIndex] = buffers.nodeField.opacities[nodeIndex];
      field.pulseAmplitudes[pointIndex] = buffers.nodeField.pulseAmplitudes[nodeIndex];
      field.pulseFrequencies[pointIndex] = buffers.nodeField.pulseFrequencies[nodeIndex];
      field.scales[pointIndex] = buffers.nodeField.scales[nodeIndex];
      field.seeds[pointIndex] = buffers.nodeField.seeds[nodeIndex];
      field.synchronizations[pointIndex] = buffers.nodeField.synchronizations[nodeIndex];
    }
  });
};

export const createNeuralCoreSemanticBufferState = (
  graph: NeuralCoreGraph,
  topologyVisualState: NeuralCoreTopologyVisualState,
  config: NeuralCoreSemanticVisualizationConfig,
  topology?: NeuralCoreTopology,
  previous?: NeuralCoreSemanticBufferState,
): NeuralCoreSemanticBufferState => {
  const nodeBufferIndexById = createNodeBufferIndexById(graph);
  const clusterEffectIndexById = Object.fromEntries(
    topologyVisualState.clusterRegions.map((region, index) => [region.clusterId, index]),
  );
  const synapseEffectIndexById = Object.fromEntries(
    (topology?.synapses ?? []).map((synapse, index) => [synapse.id, index]),
  );
  const pathwayContributionsBySynapseId: Record<
    string,
    NeuralCoreSemanticRibbonPathwayContribution[]
  > = {};
  (topology?.pathways ?? []).forEach((pathway, pathwayIndex): void => {
    const routeCount = pathway.synapseIds.length;
    pathway.synapseIds.forEach((synapseId, routeIndex): void => {
      const contributions = pathwayContributionsBySynapseId[synapseId] ?? [];
      contributions.push({
        effectIndex: pathwayIndex,
        routeCount,
        routeIndex,
      });
      pathwayContributionsBySynapseId[synapseId] = contributions;
    });
  });
  const segments = topologyVisualState.synapseRoutes.flatMap((route) => {
    return createSynapseSegments(
      route,
      config.synapse.fragmentationSegmentLength,
      synapseEffectIndexById[route.synapseId] ?? -1,
      pathwayContributionsBySynapseId[route.synapseId] ?? [],
    );
  });
  const nodeField = createNodeField(graph, config);
  const clusterMembershipMasks = createClusterMembershipMasks(
    graph.nodes.length,
    nodeBufferIndexById,
    topologyVisualState,
  );
  const connectionFields = graph.connectionBuffers.map((buffer) => {
    return createConnectionField(buffer, nodeBufferIndexById, clusterMembershipMasks);
  });
  const buffers: NeuralCoreSemanticBufferState = {
    clusterEffectIndexById,
    connectionFields,
    directionClusterLevels: new Uint8Array(topologyVisualState.clusterRegions.length),
    directionSynapseLevels: new Uint8Array(topology?.synapses.length ?? 0),
    nodeBufferIndexById,
    nodeField,
    nodeFocusLevels: new Uint8Array(graph.nodes.length),
    nodeMembershipEffectIndices: createNodeMembership(
      graph.nodes.length,
      nodeBufferIndexById,
      topologyVisualState,
    ),
    pointCloudFields: createPointCloudFields(graph),
    ribbonField: createRibbonField(segments, config, previous?.ribbonField),
    synapseEffectIndexById,
  };

  copyNodeFieldCurrent(previous?.nodeField, nodeField);
  copyConnectionFieldsCurrent(previous?.connectionFields, connectionFields);
  synchronizePointCloudFields(buffers, graph);

  return buffers;
};

const resetNodeTargets = (
  field: NeuralCoreSemanticNodeField,
  neutralColor: number,
): void => {
  field.targets.colorInfluences.fill(0);
  field.targets.brightnesses.fill(1);
  field.targets.decays.fill(0);
  field.targets.fills.fill(0);
  field.targets.fragmentations.fill(0);
  field.targets.jitters.fill(0);
  field.targets.opacities.fill(1);
  field.targets.pulseAmplitudes.fill(0);
  field.targets.pulseFrequencies.fill(0);
  field.targets.scales.fill(1);
  field.targets.synchronizations.fill(0);
  for (let nodeIndex = 0; nodeIndex < field.maximumPointCount; nodeIndex += 1) {
    writePackedColor(field.targets.colors, nodeIndex, neutralColor);
  }
};

const getClusterStrength = (cluster: NeuralCoreClusterSemanticVisualState): number => {
  return Math.max(
    cluster.activity,
    cluster.density,
    cluster.fillIntensity,
    cluster.internalConnectivity,
    cluster.synchronization,
    cluster.instability,
    cluster.fragmentation,
    cluster.nodeDecay,
  );
};

const compileDirectionFocusLevels = (
  buffers: NeuralCoreSemanticBufferState,
  directionState: NeuralCoreSceneDirectionState,
): void => {
  buffers.directionClusterLevels.fill(0);
  buffers.directionSynapseLevels.fill(0);
  if (directionState.isOverview) {
    return;
  }
  for (const clusterId of directionState.neighborClusterIds) {
    const index = buffers.clusterEffectIndexById[clusterId];
    if (index !== undefined) {
      buffers.directionClusterLevels[index] = Math.max(
        buffers.directionClusterLevels[index],
        1,
      );
    }
  }
  for (const clusterId of directionState.targetClusterIds) {
    const index = buffers.clusterEffectIndexById[clusterId];
    if (index !== undefined) {
      buffers.directionClusterLevels[index] = 2;
    }
  }
  for (const synapseId of directionState.relatedSynapseIds) {
    const index = buffers.synapseEffectIndexById[synapseId];
    if (index !== undefined) {
      buffers.directionSynapseLevels[index] = Math.max(
        buffers.directionSynapseLevels[index],
        1,
      );
    }
  }
  for (const synapseId of directionState.targetSynapseIds) {
    const index = buffers.synapseEffectIndexById[synapseId];
    if (index !== undefined) {
      buffers.directionSynapseLevels[index] = 2;
    }
  }
};

const getDirectionFocusAmount = (
  directionState: NeuralCoreSceneDirectionState,
  directionConfig: NeuralCoreSceneDirectionConfig,
): number => {
  return directionConfig.focus.maximumTargetEmphasis <= 0
    ? 0
    : clamp(
      directionState.targetEmphasis / directionConfig.focus.maximumTargetEmphasis,
    );
};

const getDirectionContextAmount = (
  directionState: NeuralCoreSceneDirectionState,
  directionConfig: NeuralCoreSceneDirectionConfig,
): number => {
  return directionConfig.focus.maximumContextDim <= 0
    ? 0
    : clamp(
      directionState.contextDim / directionConfig.focus.maximumContextDim,
    );
};

const getDirectionContextOpacity = (
  directionState: NeuralCoreSceneDirectionState,
  directionConfig: NeuralCoreSceneDirectionConfig,
  configuredOpacity: number,
): number => {
  const contextAmount = getDirectionContextAmount(directionState, directionConfig);
  return Math.max(
    directionConfig.focus.minimumPeripheralOpacity,
    directionState.peripheralOpacity,
    1 - contextAmount * (1 - configuredOpacity),
  );
};

export const getNeuralCoreNodeVisualEmphasis = (
  nodeKind: NeuralCoreNodeKind,
  focusLevel: number,
  directionState: NeuralCoreSceneDirectionState,
  directionConfig: NeuralCoreSceneDirectionConfig,
): NeuralCoreNodeVisualEmphasis => {
  if (directionState.isOverview) {
    return { scale: 1, opacity: 1, brightness: 1 };
  }

  const focusAmount = getDirectionFocusAmount(directionState, directionConfig);
  const contextAmount = getDirectionContextAmount(directionState, directionConfig);
  if (focusLevel >= 2) {
    const configuredScale = nodeKind === "hub" || nodeKind === "core"
      ? directionConfig.focus.activeHubScale
      : directionConfig.focus.activeClusterScale;
    return {
      scale: 1 + (configuredScale - 1) * focusAmount,
      opacity: 1,
      brightness: 1 + focusAmount * 0.3,
    };
  }

  if (focusLevel === 1) {
    return {
      scale: 1 + directionConfig.focus.neighborEmphasis * focusAmount,
      opacity: Math.max(
        directionConfig.focus.contextNodeOpacity,
        1 - contextAmount * 0.22,
      ),
      brightness: 1 + directionConfig.focus.neighborEmphasis * focusAmount * 0.42,
    };
  }

  return {
    scale: 1 - contextAmount * 0.08,
    opacity: getDirectionContextOpacity(
      directionState,
      directionConfig,
      directionConfig.focus.contextNodeOpacity,
    ),
    brightness: 1 - contextAmount * 0.3,
  };
};

const writeNodeTargets = (
  buffers: NeuralCoreSemanticBufferState,
  graph: NeuralCoreGraph,
  visualState: NeuralCoreSemanticVisualState,
  config: NeuralCoreSemanticVisualizationConfig,
  directionState: NeuralCoreSceneDirectionState,
  directionConfig: NeuralCoreSceneDirectionConfig,
  narrativeVisualState: NeuralCoreNarrativeVisualState,
  cameraProfile: NeuralCoreCameraRenderingProfile,
  inspectionVisibility: NeuralCoreInspectionVisibilityState,
): number => {
  const field = buffers.nodeField;
  const neutralColor = parseHexColor(config.color.neutral);
  resetNodeTargets(field, neutralColor);
  let activeNodeCount = 0;

  for (let nodeIndex = 0; nodeIndex < field.maximumPointCount; nodeIndex += 1) {
    const memberships = buffers.nodeMembershipEffectIndices[nodeIndex];
    let activity = 0;
    let density = 0;
    let fill = 0;
    let jitter = 0;
    let fragmentation = 0;
    let decay = 0;
    let synchronization = 0;
    let pulseFrequency = 0;
    let pulseAmplitude = 0;
    let persistence = 0;
    let strongestColorScore = 0;
    let strongestColor = neutralColor;
    let focusLevel = 0;
    let narrativeNodeScale = 1;
    let narrativeHubScale = 1;
    let narrativeInternalActivity = 0;
    let narrativeArrival = 0;
    let isNarrativeCluster = false;

    for (let membershipIndex = 0; membershipIndex < memberships.length; membershipIndex += 1) {
      const cluster = visualState.clusterEffects[memberships[membershipIndex]];
      if (!cluster) {
        continue;
      }
      focusLevel = Math.max(
        focusLevel,
        buffers.directionClusterLevels[memberships[membershipIndex]] ?? 0,
      );
      const strength = getClusterStrength(cluster);
      activity = Math.max(activity, cluster.activity);
      density = Math.max(density, cluster.density);
      fill = Math.max(fill, cluster.fillIntensity);
      jitter = Math.max(jitter, cluster.jitter);
      fragmentation = Math.max(fragmentation, cluster.fragmentation);
      decay = Math.max(decay, cluster.nodeDecay);
      synchronization = Math.max(synchronization, cluster.synchronization);
      pulseFrequency = Math.max(pulseFrequency, cluster.pulseFrequency);
      pulseAmplitude = Math.max(pulseAmplitude, cluster.pulseAmplitude);
      persistence = Math.max(persistence, cluster.persistence);
      const colorScore = cluster.colorInfluence + strength * 0.35;
      if (colorScore > strongestColorScore) {
        strongestColorScore = colorScore;
        strongestColor = parseHexColor(cluster.color);
      }
      const behavior = narrativeVisualState.clusterBehaviorById[cluster.clusterId];
      isNarrativeCluster ||= narrativeVisualState.activeClusterIds[cluster.clusterId] === true;
      if (behavior) {
        narrativeNodeScale = Math.max(narrativeNodeScale, behavior.nodeScale);
        narrativeHubScale = Math.max(narrativeHubScale, behavior.hubScale);
        narrativeInternalActivity = Math.max(
          narrativeInternalActivity,
          narrativeVisualState.narrativeState.internalActivity,
        );
        pulseFrequency = Math.max(
          pulseFrequency,
          behavior.pulseFrequency
            + field.seeds[nodeIndex] * behavior.pulseVariance,
        );
        pulseAmplitude = Math.max(
          pulseAmplitude,
          narrativeInternalActivity * (0.18 + behavior.synchronization * 0.18),
        );
        persistence = Math.max(persistence, behavior.persistence);
        synchronization = Math.max(synchronization, behavior.synchronization);
      }
      if (narrativeVisualState.arrivalClusterIds[cluster.clusterId]) {
        narrativeArrival = Math.max(
          narrativeArrival,
          narrativeVisualState.arrivalIntensity,
        );
      }
    }

    const strength = Math.max(activity, density, fill, fragmentation, decay, synchronization);
    if (strength > 0.002) {
      activeNodeCount += 1;
    }
    field.targets.colorInfluences[nodeIndex] = clamp(strongestColorScore);
    writePackedColor(field.targets.colors, nodeIndex, strongestColor);
    const nodeKind = graph.nodes[nodeIndex]?.kind ?? "micro";
    const nodeEmphasis = getNeuralCoreNodeVisualEmphasis(
      nodeKind,
      focusLevel,
      directionState,
      directionConfig,
    );
    let targetScale = 1 + (
      density * 0.55 + fill * 0.28 + activity * 0.2
    ) * (config.cluster.maximumNodeScale - 1);
    let targetOpacity = clamp(1 - fragmentation * 0.08, 0.72, 1);
    let targetFill = fill * config.cluster.maximumFillIntensity;
    if (!directionState.isOverview) {
      if (focusLevel >= 2) {
        targetOpacity = Math.max(targetOpacity, 0.96);
        targetFill = Math.max(targetFill, directionState.clusterFillEmphasis);
      } else if (focusLevel === 1) {
        targetFill = Math.max(targetFill, directionState.clusterFillEmphasis * 0.24);
      }
    }
    const behaviorScale = nodeKind === "hub" || nodeKind === "core"
      ? narrativeHubScale
      : narrativeNodeScale;
    targetScale *= 1 + (behaviorScale - 1)
      * narrativeVisualState.narrativeState.transitionProgress;
    targetScale *= 1 + narrativeArrival * 0.12;
    targetOpacity = Math.max(
      targetOpacity,
      clamp(narrativeInternalActivity * 0.28 + narrativeArrival * 0.46),
    );
    targetFill = Math.max(
      targetFill,
      narrativeInternalActivity * 0.48 + narrativeArrival * 0.34,
    );
    if (narrativeVisualState.narrativeState.isActive) {
      const narrativeContextDim = narrativeVisualState.narrativeState.contextDim;
      if (isNarrativeCluster) {
        const clusterEmphasis = narrativeVisualState.narrativeState.clusterEmphasis;
        targetScale *= 1 + clusterEmphasis * 0.08;
        targetOpacity = Math.max(targetOpacity, 0.9 + clusterEmphasis * 0.1);
      } else {
        targetOpacity *= 1 - narrativeContextDim * 0.52;
      }
    }
    targetScale *= nodeEmphasis.scale;
    targetOpacity *= nodeEmphasis.opacity;
    const semanticBrightness = nodeEmphasis.brightness
      * (1 + narrativeInternalActivity * 0.24 + narrativeArrival * 0.32)
      * (narrativeVisualState.narrativeState.isActive && !isNarrativeCluster
        ? 1 - narrativeVisualState.narrativeState.contextDim * 0.34
        : 1 + narrativeVisualState.narrativeState.clusterEmphasis * 0.2);
    const composition = writeNeuralCoreElementVisualComposition(
      SEMANTIC_VISUAL_COMPOSITION,
      resolveNeuralCoreInspectionVisibilityRole(focusLevel),
      "node",
      targetOpacity,
      semanticBrightness,
      targetScale,
      1,
      1,
      1,
      1,
      1,
      cameraProfile,
      inspectionVisibility,
    );
    buffers.nodeFocusLevels[nodeIndex] = focusLevel;
    field.targets.scales[nodeIndex] = Math.min(
      config.cluster.maximumNodeScale
        * (nodeKind === "hub" || nodeKind === "core" ? 1.32 : 1.18),
      composition.scale,
    );
    field.targets.opacities[nodeIndex] = composition.opacity;
    field.targets.brightnesses[nodeIndex] = composition.brightness;
    field.targets.jitters[nodeIndex] = jitter;
    field.targets.fragmentations[nodeIndex] = fragmentation;
    field.targets.decays[nodeIndex] = decay;
    field.targets.fills[nodeIndex] = targetFill;
    field.targets.synchronizations[nodeIndex] = synchronization;
    field.targets.pulseFrequencies[nodeIndex] = pulseFrequency
      * config.cluster.internalPulseSpeed;
    field.targets.pulseAmplitudes[nodeIndex] = Math.max(pulseAmplitude, persistence * 0.22);
  }

  return activeNodeCount;
};

const dampArray = (
  current: Float32Array,
  target: Float32Array,
  activationResponse: number,
  releaseResponse: number,
  deltaSeconds: number,
): boolean => {
  let changed = false;
  const activationAmount = dampNeuralCoreValue(
    0,
    1,
    activationResponse,
    deltaSeconds,
  );
  const releaseAmount = dampNeuralCoreValue(
    0,
    1,
    releaseResponse,
    deltaSeconds,
  );
  for (let index = 0; index < current.length; index += 1) {
    const previous = current[index];
    const amount = target[index] > previous ? activationAmount : releaseAmount;
    const next = previous + (target[index] - previous) * amount;
    current[index] = next;
    changed ||= Math.abs(next - previous) > 0.00001;
  }
  return changed;
};

const dampNodeField = (
  field: NeuralCoreSemanticNodeField,
  config: NeuralCoreSemanticVisualizationConfig,
  deltaSeconds: number,
): boolean => {
  const transition = config.transition;
  let changed = dampArray(
    field.brightnesses,
    field.targets.brightnesses,
    transition.activationResponse,
    transition.releaseResponse,
    deltaSeconds,
  );
  changed = dampArray(
    field.colors,
    field.targets.colors,
    transition.colorResponse,
    transition.colorResponse,
    deltaSeconds,
  ) || changed;
  changed = dampArray(
    field.colorInfluences,
    field.targets.colorInfluences,
    transition.activationResponse,
    transition.releaseResponse,
    deltaSeconds,
  ) || changed;
  changed = dampArray(field.decays, field.targets.decays, transition.activationResponse, transition.releaseResponse, deltaSeconds) || changed;
  changed = dampArray(field.fills, field.targets.fills, transition.activationResponse, transition.releaseResponse, deltaSeconds) || changed;
  changed = dampArray(field.fragmentations, field.targets.fragmentations, transition.displacementResponse, transition.displacementResponse, deltaSeconds) || changed;
  changed = dampArray(field.jitters, field.targets.jitters, transition.displacementResponse, transition.displacementResponse, deltaSeconds) || changed;
  changed = dampArray(field.opacities, field.targets.opacities, transition.activationResponse, transition.releaseResponse, deltaSeconds) || changed;
  changed = dampArray(field.pulseAmplitudes, field.targets.pulseAmplitudes, transition.activationResponse, transition.releaseResponse, deltaSeconds) || changed;
  changed = dampArray(field.pulseFrequencies, field.targets.pulseFrequencies, transition.activationResponse, transition.releaseResponse, deltaSeconds) || changed;
  changed = dampArray(field.scales, field.targets.scales, transition.activationResponse, transition.releaseResponse, deltaSeconds) || changed;
  changed = dampArray(field.synchronizations, field.targets.synchronizations, transition.activationResponse, transition.releaseResponse, deltaSeconds) || changed;
  return changed;
};

const updateConnectionTargets = (
  buffers: NeuralCoreSemanticBufferState,
  visualState: NeuralCoreSemanticVisualState,
  config: NeuralCoreSemanticVisualizationConfig,
  directionState: NeuralCoreSceneDirectionState,
  directionConfig: NeuralCoreSceneDirectionConfig,
  narrativeVisualState: NeuralCoreNarrativeVisualState,
  cameraProfile: NeuralCoreCameraRenderingProfile,
  inspectionVisibility: NeuralCoreInspectionVisibilityState,
): void => {
  for (const field of buffers.connectionFields) {
    field.targetColors.set(field.baseColors);
    field.targetOpacities.set(field.baseOpacities);
    for (
      let connectionIndex = 0;
      connectionIndex < field.clusterEffectIndicesByConnection.length;
      connectionIndex += 1
    ) {
      const memberships = field.clusterEffectIndicesByConnection[connectionIndex];
      let reinforcement = 0;
      let decay = 0;
      let fragmentation = 0;
      let colorInfluence = 0;
      let semanticColor = parseHexColor(config.color.neutral);
      let focusLevel = 0;
      let narrativeInternalEmphasis = 0;
      let narrativeArrival = 0;
      let isNarrativeCluster = false;
      for (let membershipIndex = 0; membershipIndex < memberships.length; membershipIndex += 1) {
        const cluster = visualState.clusterEffects[memberships[membershipIndex]];
        if (!cluster) {
          continue;
        }
        focusLevel = Math.max(
          focusLevel,
          buffers.directionClusterLevels[memberships[membershipIndex]] ?? 0,
        );
        reinforcement = Math.max(
          reinforcement,
          cluster.internalConnectivity,
          cluster.density * 0.72,
        );
        decay = Math.max(decay, cluster.nodeDecay);
        fragmentation = Math.max(fragmentation, cluster.fragmentation);
        if (cluster.colorInfluence > colorInfluence) {
          colorInfluence = cluster.colorInfluence;
          semanticColor = parseHexColor(cluster.color);
        }
        const behavior = narrativeVisualState.clusterBehaviorById[cluster.clusterId];
        isNarrativeCluster ||= narrativeVisualState.activeClusterIds[cluster.clusterId] === true;
        if (behavior) {
          narrativeInternalEmphasis = Math.max(
            narrativeInternalEmphasis,
            behavior.internalConnectionEmphasis
              * narrativeVisualState.narrativeState.internalActivity,
          );
        }
        if (narrativeVisualState.arrivalClusterIds[cluster.clusterId]) {
          narrativeArrival = Math.max(
            narrativeArrival,
            narrativeVisualState.arrivalIntensity,
          );
        }
      }
      for (let endpointIndex = 0; endpointIndex < 2; endpointIndex += 1) {
        const vertexIndex = connectionIndex * 2 + endpointIndex;
        const colorOffset = vertexIndex * 3;
        const baseOpacity = field.baseOpacities[vertexIndex];
        let targetOpacity = clamp(
          baseOpacity * (1 - decay * 0.9 - fragmentation * 0.4)
            + reinforcement * 0.2,
          0,
          config.synapse.maximumOpacity * 0.58,
        );
        targetOpacity = Math.max(
          targetOpacity,
          baseOpacity
            + narrativeInternalEmphasis * 0.13
            + narrativeArrival * 0.09,
        );
        if (narrativeVisualState.narrativeState.isActive && !isNarrativeCluster) {
          targetOpacity *= 1 - narrativeVisualState.narrativeState.contextDim * 0.58;
        }
        if (!directionState.isOverview) {
          if (focusLevel >= 2) {
            targetOpacity = Math.max(
              targetOpacity,
              baseOpacity
                + directionState.targetEmphasis
                  * directionConfig.focus.internalConnectionEmphasis,
            );
          } else if (focusLevel === 1) {
            targetOpacity = Math.max(
              targetOpacity * (1 - directionState.contextDim * 0.16),
              baseOpacity
                + directionState.targetEmphasis
                  * directionConfig.focus.internalConnectionEmphasis
                  * directionConfig.focus.neighborEmphasis,
            );
          } else {
            targetOpacity *= getDirectionContextOpacity(
              directionState,
              directionConfig,
              directionConfig.focus.contextConnectionOpacity,
            );
          }
        }
        const composition = writeNeuralCoreElementVisualComposition(
          SEMANTIC_VISUAL_COMPOSITION,
          resolveNeuralCoreInspectionVisibilityRole(focusLevel),
          "internal-connection",
          targetOpacity,
          1,
          1,
          1,
          1,
          1,
          1,
          1,
          cameraProfile,
          inspectionVisibility,
        );
        targetOpacity = composition.opacity;
        const maximumConnectionOpacity = inspectionVisibility.enabled
          ? config.synapse.maximumOpacity * (
            focusLevel >= 2 ? 0.92 : focusLevel === 1 ? 0.78 : 0.68
          )
          : config.synapse.maximumOpacity * 0.68;
        field.targetOpacities[vertexIndex] = clamp(
          targetOpacity,
          0,
          maximumConnectionOpacity,
        );
        const tintAmount = clamp(colorInfluence * 0.82 + reinforcement * 0.16);
        const semanticRed = ((semanticColor >> 16) & 255) / 255;
        const semanticGreen = ((semanticColor >> 8) & 255) / 255;
        const semanticBlue = (semanticColor & 255) / 255;
        field.targetColors[colorOffset] = field.baseColors[colorOffset]
          + (semanticRed - field.baseColors[colorOffset]) * tintAmount;
        field.targetColors[colorOffset + 1] = field.baseColors[colorOffset + 1]
          + (semanticGreen - field.baseColors[colorOffset + 1]) * tintAmount;
        field.targetColors[colorOffset + 2] = field.baseColors[colorOffset + 2]
          + (semanticBlue - field.baseColors[colorOffset + 2]) * tintAmount;
      }
    }
  }
};

const dampConnectionFields = (
  buffers: NeuralCoreSemanticBufferState,
  config: NeuralCoreSemanticVisualizationConfig,
  deltaSeconds: number,
): boolean => {
  let changed = false;
  for (const field of buffers.connectionFields) {
    changed = dampArray(
      field.colors,
      field.targetColors,
      config.transition.colorResponse,
      config.transition.colorResponse,
      deltaSeconds,
    ) || changed;
    changed = dampArray(
      field.opacities,
      field.targetOpacities,
      config.transition.activationResponse,
      config.transition.releaseResponse,
      deltaSeconds,
    ) || changed;
  }
  return changed;
};

const writeRibbonSpanTargets = (
  field: NeuralCoreSemanticRibbonField,
  span: NeuralCoreSemanticRibbonSpan,
  color: number,
  fragmentation: number,
  instability: number,
  interruption: number,
  opacity: number,
  pulseFrequency: number,
  pulseIntensity: number,
  thickness: number,
): void => {
  const endVertexIndex = span.startVertexIndex + span.vertexCount;
  for (let vertexIndex = span.startVertexIndex; vertexIndex < endVertexIndex; vertexIndex += 1) {
    writePackedColor(field.targets.colors, vertexIndex, color);
    field.targets.fragmentations[vertexIndex] = fragmentation;
    field.targets.instabilities[vertexIndex] = instability;
    field.targets.interruptions[vertexIndex] = interruption;
    field.targets.opacities[vertexIndex] = opacity;
    field.targets.pulseFrequencies[vertexIndex] = pulseFrequency;
    field.targets.pulseIntensities[vertexIndex] = pulseIntensity;
    field.targets.thicknesses[vertexIndex] = thickness;
  }
};

const getSequentialPathwayContribution = (
  pathway: NeuralCorePathwaySemanticVisualState,
  contribution: NeuralCoreSemanticRibbonPathwayContribution,
): number => {
  const routeCount = Math.max(1, contribution.routeCount);
  const routeIndex = Math.min(
    routeCount - 1,
    Math.max(0, contribution.routeIndex),
  );
  const progress = clamp(pathway.sequentialEmphasis);
  const strength = Math.max(pathway.activity, pathway.completion);

  if (strength <= 0.001 || progress <= 0.001) {
    return 0;
  }

  if (progress >= 0.999) {
    return pathway.completion > 0.001 && routeIndex === routeCount - 1
      ? strength
      : 0;
  }

  const routeCenter = routeIndex + 0.5;
  const pathwayPosition = progress * routeCount;
  const distanceFromRoute = Math.abs(pathwayPosition - routeCenter);
  const routeWindow = 1 - smoothStep(0.42, 0.58, distanceFromRoute);

  return strength * routeWindow;
};

const updateRibbonTargets = (
  buffers: NeuralCoreSemanticBufferState,
  visualState: NeuralCoreSemanticVisualState,
  config: NeuralCoreSemanticVisualizationConfig,
  directionState: NeuralCoreSceneDirectionState,
  directionConfig: NeuralCoreSceneDirectionConfig,
  narrativeVisualState: NeuralCoreNarrativeVisualState,
  routeBackgroundOpacity: number,
  cameraProfile: NeuralCoreCameraRenderingProfile,
  inspectionVisibility: NeuralCoreInspectionVisibilityState,
): number => {
  let activeRibbonVertexCount = 0;
  const neutralColor = parseHexColor(config.color.neutral);

  for (const span of buffers.ribbonField.spans) {
    if (span.releasing) {
      const endVertexIndex = span.startVertexIndex + span.vertexCount;
      for (
        let vertexIndex = span.startVertexIndex;
        vertexIndex < endVertexIndex;
        vertexIndex += 1
      ) {
        const colorOffset = vertexIndex * 3;
        buffers.ribbonField.targets.colors[colorOffset]
          = buffers.ribbonField.colors[colorOffset];
        buffers.ribbonField.targets.colors[colorOffset + 1]
          = buffers.ribbonField.colors[colorOffset + 1];
        buffers.ribbonField.targets.colors[colorOffset + 2]
          = buffers.ribbonField.colors[colorOffset + 2];
        buffers.ribbonField.targets.fragmentations[vertexIndex] = 0;
        buffers.ribbonField.targets.instabilities[vertexIndex] = 0;
        buffers.ribbonField.targets.interruptions[vertexIndex] = 0;
        buffers.ribbonField.targets.opacities[vertexIndex] = 0;
        buffers.ribbonField.targets.pulseFrequencies[vertexIndex] = 0;
        buffers.ribbonField.targets.pulseIntensities[vertexIndex] = 0;
        buffers.ribbonField.targets.thicknesses[vertexIndex]
          = config.synapse.minimumThickness;
      }
      continue;
    }
    const synapse = span.synapseEffectIndex >= 0
      ? visualState.synapseEffects[span.synapseEffectIndex]
      : undefined;
    let pathwayBoost = 0;
    for (
      let contributionIndex = 0;
      contributionIndex < span.pathwayContributions.length;
      contributionIndex += 1
    ) {
      const contribution = span.pathwayContributions[contributionIndex];
      const pathway = visualState.pathwayEffects[contribution.effectIndex];
      if (pathway) {
        pathwayBoost = Math.max(
          pathwayBoost,
          getSequentialPathwayContribution(pathway, contribution),
        );
      }
    }
    const semanticStrength = Math.max(
      synapse?.activity ?? 0,
      synapse?.emphasis ?? 0,
      pathwayBoost,
    );
    const conductivity = synapse?.conductivity ?? 1;
    const baseOpacity = config.enabled ? config.synapse.minimumOpacity : 0;
    let opacity = clamp(
      (
        baseOpacity
        + semanticStrength * (config.synapse.maximumOpacity - baseOpacity)
      ) * (0.52 + conductivity * 0.48),
      0,
      config.synapse.maximumOpacity,
    );
    let thicknessEffect = Math.max(
      synapse?.thickness ?? 0,
      (synapse?.emphasis ?? 0) * 0.48,
      pathwayBoost * 0.36,
    );
    let pulseIntensity = synapse?.pulseIntensity ?? 0;
    const isNarrativeRoute = narrativeVisualState.activeSynapseIds[span.semanticId] === true;
    if (isNarrativeRoute) {
      const narrativeRouteEmphasis = narrativeVisualState.narrativeState.routeEmphasis;
      opacity = Math.max(
        opacity * routeBackgroundOpacity,
        config.synapse.minimumOpacity
          + narrativeRouteEmphasis
            * (config.synapse.maximumOpacity - config.synapse.minimumOpacity)
            * 0.28,
      );
      thicknessEffect = Math.max(thicknessEffect, narrativeRouteEmphasis * 0.42);
      pulseIntensity = Math.max(pulseIntensity, narrativeRouteEmphasis * 0.62);
    } else if (narrativeVisualState.narrativeState.isActive) {
      opacity *= routeBackgroundOpacity;
      pulseIntensity *= routeBackgroundOpacity;
    }
    const directionLevel = span.synapseEffectIndex >= 0
      ? buffers.directionSynapseLevels[span.synapseEffectIndex]
      : 0;
    if (!directionState.isOverview) {
      if (directionLevel >= 2) {
        opacity = Math.max(
          opacity,
          config.synapse.minimumOpacity
            + directionState.routeEmphasis
              * (config.synapse.maximumOpacity - config.synapse.minimumOpacity) * 0.42,
        );
        thicknessEffect = Math.max(thicknessEffect, directionState.routeEmphasis * 0.52);
        pulseIntensity = Math.max(pulseIntensity, directionState.routeEmphasis * 0.68);
      } else if (directionLevel === 1) {
        opacity = Math.max(
          opacity,
          config.synapse.minimumOpacity
            + directionState.routeEmphasis
              * (config.synapse.maximumOpacity - config.synapse.minimumOpacity) * 0.44,
        );
        thicknessEffect = Math.max(thicknessEffect, directionState.routeEmphasis * 0.28);
        pulseIntensity = Math.max(pulseIntensity, directionState.routeEmphasis * 0.4);
      } else {
        const peripheralOpacity = getDirectionContextOpacity(
          directionState,
          directionConfig,
          directionConfig.focus.contextConnectionOpacity,
        );
        opacity *= peripheralOpacity;
        pulseIntensity *= peripheralOpacity;
      }
    }
    let thickness = config.synapse.minimumThickness
      + clamp(thicknessEffect) * (
        config.synapse.maximumThickness - config.synapse.minimumThickness
      );
    const visibilityRole = isNarrativeRoute
      ? "selected"
      : directionLevel >= 1 ? "related" : "context";
    const composition = writeNeuralCoreElementVisualComposition(
      SEMANTIC_VISUAL_COMPOSITION,
      visibilityRole,
      "connection",
      opacity,
      1,
      1,
      thickness,
      1,
      1,
      1,
      1,
      cameraProfile,
      inspectionVisibility,
    );
    opacity = clamp(composition.opacity, 0, config.synapse.maximumOpacity);
    thickness = clamp(
      composition.thickness,
      config.synapse.minimumThickness,
      config.synapse.maximumThickness,
    );
    pulseIntensity *= composition.brightness;
    const fragmentation = synapse?.fragmentation ?? 0;
    const instability = synapse?.instability ?? 0;
    const interruption = Math.max(
      synapse?.interruption ?? 0,
      (1 - conductivity) * semanticStrength * 0.45,
    );
    if (opacity > 0.001) {
      activeRibbonVertexCount += span.vertexCount;
    }
    writeRibbonSpanTargets(
      buffers.ribbonField,
      span,
      synapse ? parseHexColor(synapse.color) : neutralColor,
      fragmentation,
      instability,
      interruption,
      opacity,
      synapse?.pulseFrequency ?? 0,
      pulseIntensity,
      thickness,
    );
  }

  return activeRibbonVertexCount;
};

const dampRibbonField = (
  field: NeuralCoreSemanticRibbonField,
  config: NeuralCoreSemanticVisualizationConfig,
  deltaSeconds: number,
): boolean => {
  let changed = dampArray(field.colors, field.targets.colors, config.transition.colorResponse, config.transition.colorResponse, deltaSeconds);
  changed = dampArray(field.fragmentations, field.targets.fragmentations, config.transition.displacementResponse, config.transition.displacementResponse, deltaSeconds) || changed;
  changed = dampArray(field.instabilities, field.targets.instabilities, config.transition.activationResponse, config.transition.releaseResponse, deltaSeconds) || changed;
  changed = dampArray(field.interruptions, field.targets.interruptions, config.transition.activationResponse, config.transition.releaseResponse, deltaSeconds) || changed;
  changed = dampArray(field.opacities, field.targets.opacities, config.transition.activationResponse, config.transition.releaseResponse, deltaSeconds) || changed;
  changed = dampArray(field.pulseFrequencies, field.targets.pulseFrequencies, config.transition.activationResponse, config.transition.releaseResponse, deltaSeconds) || changed;
  changed = dampArray(field.pulseIntensities, field.targets.pulseIntensities, config.transition.activationResponse, config.transition.releaseResponse, deltaSeconds) || changed;
  changed = dampArray(field.thicknesses, field.targets.thicknesses, config.transition.activationResponse, config.transition.releaseResponse, deltaSeconds) || changed;
  return changed;
};

export const updateNeuralCoreSemanticBuffers = (
  buffers: NeuralCoreSemanticBufferState,
  graph: NeuralCoreGraph,
  visualState: NeuralCoreSemanticVisualState,
  config: NeuralCoreSemanticVisualizationConfig,
  directionState: NeuralCoreSceneDirectionState,
  directionConfig: NeuralCoreSceneDirectionConfig,
  narrativeVisualState: NeuralCoreNarrativeVisualState,
  routeBackgroundOpacity: number,
  deltaSeconds: number,
  cameraProfile: NeuralCoreCameraRenderingProfile,
  inspectionVisibility: NeuralCoreInspectionVisibilityState,
): NeuralCoreSemanticBufferUpdateResult => {
  compileDirectionFocusLevels(buffers, directionState);
  const activeNodeCount = writeNodeTargets(
    buffers,
    graph,
    visualState,
    config,
    directionState,
    directionConfig,
    narrativeVisualState,
    cameraProfile,
    inspectionVisibility,
  );
  const nodeAttributesChanged = dampNodeField(buffers.nodeField, config, deltaSeconds);
  if (nodeAttributesChanged) {
    synchronizePointCloudFields(buffers, graph);
  }
  updateConnectionTargets(
    buffers,
    visualState,
    config,
    directionState,
    directionConfig,
    narrativeVisualState,
    cameraProfile,
    inspectionVisibility,
  );
  const connectionAttributesChanged = dampConnectionFields(buffers, config, deltaSeconds);
  const activeRibbonVertexCount = updateRibbonTargets(
    buffers,
    visualState,
    config,
    directionState,
    directionConfig,
    narrativeVisualState,
    routeBackgroundOpacity,
    cameraProfile,
    inspectionVisibility,
  );
  const ribbonAttributesChanged = dampRibbonField(buffers.ribbonField, config, deltaSeconds);

  return {
    activeNodeCount,
    activeRibbonVertexCount,
    connectionAttributesChanged,
    nodeAttributesChanged,
    ribbonAttributesChanged,
  };
};

export const createNeuralCoreSemanticBufferDimensionsKey = (
  config: NeuralCoreSemanticVisualizationConfig,
): string => {
  return [config.synapse.fragmentationSegmentLength].join(":");
};
