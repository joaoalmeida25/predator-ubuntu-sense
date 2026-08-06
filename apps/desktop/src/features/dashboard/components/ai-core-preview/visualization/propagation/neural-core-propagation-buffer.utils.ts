import type { NeuralCorePropagationConfig } from "../../domain/propagation/neural-core-propagation.types";
import type {
  NeuralCorePropagationVisualPulse,
  NeuralCorePropagationVisualState,
} from "./neural-core-propagation-visual.types";
import type {
  NeuralCorePropagationBufferState,
  NeuralCorePropagationBufferUpdateResult,
  NeuralCorePropagationClusterBufferRegion,
  NeuralCoreOperationalProtagonistMarkerField,
  NeuralCorePropagationPointField,
} from "./neural-core-propagation-buffer.types";
import type {
  NeuralCoreGraph,
  NeuralCoreVector3,
} from "../graph/neural-core-graph.types";
import type {
  NeuralCoreSynapseVisualRoute,
  NeuralCoreTopologyVisualState,
} from "../topology/neural-core-topology-visual.types";
import type {
  NeuralCoreSceneDirectionConfig,
  NeuralCoreSceneDirectionState,
} from "../direction/neural-core-scene-direction.types";
import type { NeuralCoreInspectionVisibilityState } from "../inspection/neural-core-inspection-visibility.types";
import {
  resolveNeuralCoreInspectionVisibilityRole,
} from "../inspection/neural-core-inspection-visibility.utils";
import type { NeuralCoreCameraRenderingProfile } from "../inspection/neural-core-camera-rendering.types";
import type { NeuralCoreElementVisualComposition } from "../inspection/neural-core-element-visual-composition.types";
import { writeNeuralCoreElementVisualComposition } from "../inspection/neural-core-element-visual-composition.utils";
import {
  getNeuralCoreClusterGrammarCurvePoint,
} from "../cluster-grammar/neural-core-cluster-grammar.utils";
import type {
  NeuralCoreOperationalRouteVisualChannel,
} from "../cluster-grammar/neural-core-operational-route-visual-channel.types";
import {
  NEURAL_CORE_TOPOLOGY_STATUS_COLORS,
} from "../topology/neural-core-topology-visual.constants";
import {
  NEURAL_CORE_OPERATIONAL_PROTAGONIST_MARKER_CONFIG,
} from "./neural-core-operational-protagonist-marker.constants";

const clampBufferValue = (value: number, minimum = 0, maximum = 1): number => {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));
};

const DEFAULT_PACKED_COLOR = 0x8cf2ff;
const OPERATIONAL_ROUTE_TANGENT_SAMPLE_DELTA = 0.006;
const OPERATIONAL_ROUTE_TANGENT_EPSILON = 0.000001;

const PROPAGATION_VISUAL_COMPOSITION: NeuralCoreElementVisualComposition = {
  opacity: 1,
  brightness: 1,
  scale: 1,
  thickness: 1,
};

const createStringNumberRecord = (): Record<string, number> => {
  return Object.create(null) as Record<string, number>;
};

const createStringRouteRecord = (): Record<string, NeuralCoreSynapseVisualRoute> => {
  return Object.create(null) as Record<string, NeuralCoreSynapseVisualRoute>;
};

const getPackedColor = (
  packedColorByHex: Record<string, number>,
  hex: string,
): number => {
  const cached = packedColorByHex[hex];
  if (cached !== undefined) {
    return cached;
  }

  const parsed = Number.parseInt(hex.replace("#", ""), 16);
  const packed = Number.isFinite(parsed) ? parsed : DEFAULT_PACKED_COLOR;
  packedColorByHex[hex] = packed;
  return packed;
};

const getPackedColorRed = (packedColor: number): number => {
  return ((packedColor >> 16) & 255) / 255;
};

const getPackedColorGreen = (packedColor: number): number => {
  return ((packedColor >> 8) & 255) / 255;
};

const getPackedColorBlue = (packedColor: number): number => {
  return (packedColor & 255) / 255;
};

const convertSrgbChannelToLinear = (channel: number): number => {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
};

export const writeNeuralCoreRoutePositionAtProgress = (
  positions: Float32Array,
  pointIndex: number,
  route: NeuralCoreSynapseVisualRoute,
  progress: number,
): void => {
  const amount = clampBufferValue(progress);
  const control = route.controlPoints[0];
  const controlX = control?.[0] ?? (route.start[0] + route.end[0]) * 0.5;
  const controlY = control?.[1] ?? (route.start[1] + route.end[1]) * 0.5;
  const controlZ = control?.[2] ?? (route.start[2] + route.end[2]) * 0.5;
  const inverse = 1 - amount;
  const startWeight = inverse * inverse;
  const controlWeight = 2 * inverse * amount;
  const endWeight = amount * amount;
  const offset = pointIndex * 3;

  positions[offset] = startWeight * route.start[0]
    + controlWeight * controlX
    + endWeight * route.end[0];
  positions[offset + 1] = startWeight * route.start[1]
    + controlWeight * controlY
    + endWeight * route.end[1];
  positions[offset + 2] = startWeight * route.start[2]
    + controlWeight * controlZ
    + endWeight * route.end[2];
};

const writeNeuralCoreOperationalRoutePositionAtProgress = (
  positions: Float32Array,
  pointIndex: number,
  channel: NeuralCoreOperationalRouteVisualChannel,
  progress: number,
  scratchPoint: NeuralCoreVector3,
): void => {
  getNeuralCoreClusterGrammarCurvePoint(
    channel.controlPoints,
    clampBufferValue(progress),
    scratchPoint,
  );
  const offset = pointIndex * 3;
  positions[offset] = scratchPoint[0];
  positions[offset + 1] = scratchPoint[1];
  positions[offset + 2] = scratchPoint[2];
};

export const writeNeuralCoreOperationalRouteTangentAtProgress = (
  target: NeuralCoreVector3,
  channel: NeuralCoreOperationalRouteVisualChannel,
  progress: number,
  direction: "forward" | "backward",
  previousScratch: NeuralCoreVector3,
  nextScratch: NeuralCoreVector3,
): void => {
  const amount = clampBufferValue(progress);
  const previousProgress = Math.max(
    0,
    amount - OPERATIONAL_ROUTE_TANGENT_SAMPLE_DELTA,
  );
  const nextProgress = Math.min(
    1,
    amount + OPERATIONAL_ROUTE_TANGENT_SAMPLE_DELTA,
  );
  getNeuralCoreClusterGrammarCurvePoint(
    channel.controlPoints,
    previousProgress,
    previousScratch,
  );
  getNeuralCoreClusterGrammarCurvePoint(
    channel.controlPoints,
    nextProgress,
    nextScratch,
  );
  const directionMultiplier = direction === "backward" ? -1 : 1;
  let tangentX = (nextScratch[0] - previousScratch[0]) * directionMultiplier;
  let tangentY = (nextScratch[1] - previousScratch[1]) * directionMultiplier;
  let tangentZ = (nextScratch[2] - previousScratch[2]) * directionMultiplier;
  let tangentLength = Math.hypot(tangentX, tangentY, tangentZ);

  if (
    !Number.isFinite(tangentLength)
    || tangentLength <= OPERATIONAL_ROUTE_TANGENT_EPSILON
  ) {
    const firstPoint = channel.controlPoints[0];
    const lastPoint = channel.controlPoints[channel.controlPoints.length - 1];
    tangentX = ((lastPoint?.[0] ?? 0) - (firstPoint?.[0] ?? 0))
      * directionMultiplier;
    tangentY = ((lastPoint?.[1] ?? 0) - (firstPoint?.[1] ?? 0))
      * directionMultiplier;
    tangentZ = ((lastPoint?.[2] ?? 0) - (firstPoint?.[2] ?? 0))
      * directionMultiplier;
    tangentLength = Math.hypot(tangentX, tangentY, tangentZ);
  }
  if (
    !Number.isFinite(tangentLength)
    || tangentLength <= OPERATIONAL_ROUTE_TANGENT_EPSILON
  ) {
    const retainedLength = Math.hypot(target[0], target[1], target[2]);
    if (
      Number.isFinite(retainedLength)
      && retainedLength > OPERATIONAL_ROUTE_TANGENT_EPSILON
    ) {
      return;
    }
    target[0] = directionMultiplier;
    target[1] = 0;
    target[2] = 0;
    return;
  }
  const inverseLength = 1 / tangentLength;
  target[0] = tangentX * inverseLength;
  target[1] = tangentY * inverseLength;
  target[2] = tangentZ * inverseLength;
};

const createPointField = (maximumPointCount: number): NeuralCorePropagationPointField => {
  return {
    colors: new Float32Array(maximumPointCount * 3),
    maximumPointCount,
    opacities: new Float32Array(maximumPointCount),
    positions: new Float32Array(maximumPointCount * 3),
    sizes: new Float32Array(maximumPointCount),
  };
};

const createOperationalProtagonistMarkerField = (
): NeuralCoreOperationalProtagonistMarkerField => {
  return {
    colors: new Float32Array(3),
    maximumMarkerCount: 1,
    opacities: new Float32Array(1),
    positions: new Float32Array(3),
    sizes: new Float32Array(1),
    tangents: new Float32Array(3),
  };
};

const createNodePositionRecord = (
  graph: NeuralCoreGraph,
): {
  maximumNodeId: number;
  nodePositionsById: Record<number, NeuralCoreVector3>;
} => {
  const nodePositionsById = Object.create(null) as Record<number, NeuralCoreVector3>;
  let maximumNodeId = -1;

  for (const node of graph.nodes) {
    nodePositionsById[node.id] = node.position;
    maximumNodeId = Math.max(maximumNodeId, node.id);
  }

  return { maximumNodeId, nodePositionsById };
};

const createClusterBufferRegions = (
  topologyVisualState: NeuralCoreTopologyVisualState,
  clusterIndexById: Record<string, number>,
): NeuralCorePropagationClusterBufferRegion[] => {
  const regions: NeuralCorePropagationClusterBufferRegion[] = [];

  topologyVisualState.clusterRegions.forEach((region, clusterIndex): void => {
    clusterIndexById[region.clusterId] = clusterIndex;
    regions.push({
      clusterId: region.clusterId,
      hubNodeIds: region.hubIndices,
      nodeIds: region.nodeIndices,
    });
  });

  return regions;
};

export const createNeuralCorePropagationBufferState = (
  graph: NeuralCoreGraph,
  topologyVisualState: NeuralCoreTopologyVisualState,
  config: NeuralCorePropagationConfig,
): NeuralCorePropagationBufferState => {
  const clusterIndexById = createStringNumberRecord();
  const clusterRegions = createClusterBufferRegions(
    topologyVisualState,
    clusterIndexById,
  );
  const { maximumNodeId, nodePositionsById } = createNodePositionRecord(graph);
  const packedColorByHex = createStringNumberRecord();
  const routesBySynapseId = createStringRouteRecord();
  const synapseIndexById = createStringNumberRecord();

  topologyVisualState.synapseRoutes.forEach((route, index): void => {
    routesBySynapseId[route.synapseId] = route;
    synapseIndexById[route.synapseId] = index;
    getPackedColor(packedColorByHex, route.color);
  });

  const clusterCount = clusterRegions.length;

  return {
    clusterActivationColors: new Float32Array(clusterCount * 3),
    clusterActivationIntensities: new Float32Array(clusterCount),
    clusterActivationOpacities: new Float32Array(clusterCount),
    clusterActivationSizes: new Float32Array(clusterCount),
    clusterField: createPointField(graph.nodes.length),
    clusterIndexById,
    clusterFocusLevels: new Uint8Array(clusterCount),
    clusterRegions,
    nodeActivationById: new Float32Array(maximumNodeId + 1),
    nodePositionsById,
    operationalEndpointReactionState: {
      sourceWeight: 0,
      targetWeight: 0,
      red: 0,
      green: 0,
      blue: 0,
    },
    operationalProtagonistMarkerField: createOperationalProtagonistMarkerField(),
    operationalRouteNextScratchPoint: [0, 0, 0],
    operationalRoutePreviousScratchPoint: [0, 0, 0],
    operationalRouteScratchPoint: [0, 0, 0],
    operationalRouteTangentScratchPoint: [1, 0, 0],
    packedColorByHex,
    pulseField: createPointField(
      config.runtime.maximumConcurrentTransmissions * config.pulse.trailSampleCount,
    ),
    routesBySynapseId,
    synapseFocusLevels: new Uint8Array(topologyVisualState.synapseRoutes.length),
    synapseIndexById,
    updateResult: {
      clusterPointCount: 0,
      operationalProtagonistMarkerCount: 0,
      pulsePointCount: 0,
    },
  };
};

const compileDirectionFocusLevels = (
  buffers: NeuralCorePropagationBufferState,
  directionState: NeuralCoreSceneDirectionState,
): void => {
  buffers.clusterFocusLevels.fill(0);
  buffers.synapseFocusLevels.fill(0);
  if (directionState.isOverview) {
    return;
  }
  for (const clusterId of directionState.neighborClusterIds) {
    const index = buffers.clusterIndexById[clusterId];
    if (index !== undefined) {
      buffers.clusterFocusLevels[index] = Math.max(buffers.clusterFocusLevels[index], 1);
    }
  }
  for (const clusterId of directionState.targetClusterIds) {
    const index = buffers.clusterIndexById[clusterId];
    if (index !== undefined) {
      buffers.clusterFocusLevels[index] = 2;
    }
  }
  for (const synapseId of directionState.relatedSynapseIds) {
    const index = buffers.synapseIndexById[synapseId];
    if (index !== undefined) {
      buffers.synapseFocusLevels[index] = Math.max(buffers.synapseFocusLevels[index], 1);
    }
  }
  for (const synapseId of directionState.targetSynapseIds) {
    const index = buffers.synapseIndexById[synapseId];
    if (index !== undefined) {
      buffers.synapseFocusLevels[index] = 2;
    }
  }
};

const getPeripheralFocusOpacity = (
  directionState: NeuralCoreSceneDirectionState,
  directionConfig: NeuralCoreSceneDirectionConfig,
  configuredOpacity: number,
): number => {
  const contextAmount = directionConfig.focus.maximumContextDim <= 0
    ? 0
    : clampBufferValue(
      directionState.contextDim / directionConfig.focus.maximumContextDim,
    );
  return Math.max(
    directionConfig.focus.minimumPeripheralOpacity,
    directionState.peripheralOpacity,
    1 - contextAmount * (1 - configuredOpacity),
  );
};

const writePoint = (
  field: NeuralCorePropagationPointField,
  pointIndex: number,
  position: NeuralCoreVector3,
  red: number,
  green: number,
  blue: number,
  opacity: number,
  size: number,
): void => {
  const offset = pointIndex * 3;
  field.positions[offset] = position[0];
  field.positions[offset + 1] = position[1];
  field.positions[offset + 2] = position[2];
  field.colors[offset] = red;
  field.colors[offset + 1] = green;
  field.colors[offset + 2] = blue;
  field.opacities[pointIndex] = opacity;
  field.sizes[pointIndex] = size;
};

const writePointAppearance = (
  field: NeuralCorePropagationPointField,
  pointIndex: number,
  red: number,
  green: number,
  blue: number,
  opacity: number,
  size: number,
): void => {
  const offset = pointIndex * 3;
  field.colors[offset] = red;
  field.colors[offset + 1] = green;
  field.colors[offset + 2] = blue;
  field.opacities[pointIndex] = opacity;
  field.sizes[pointIndex] = size;
};

const compileClusterFrameState = (
  buffers: NeuralCorePropagationBufferState,
  visualState: NeuralCorePropagationVisualState,
): void => {
  buffers.clusterActivationIntensities.fill(0);
  buffers.nodeActivationById.fill(0);

  for (const activation of visualState.clusterActivations) {
    const clusterIndex = buffers.clusterIndexById[activation.clusterId];
    if (clusterIndex === undefined) {
      continue;
    }

    const currentIntensity = buffers.clusterActivationIntensities[clusterIndex];
    if (currentIntensity > activation.intensity) {
      continue;
    }

    const packedColor = getPackedColor(buffers.packedColorByHex, activation.color);
    const colorOffset = clusterIndex * 3;
    buffers.clusterActivationColors[colorOffset] = getPackedColorRed(packedColor);
    buffers.clusterActivationColors[colorOffset + 1] = getPackedColorGreen(packedColor);
    buffers.clusterActivationColors[colorOffset + 2] = getPackedColorBlue(packedColor);
    buffers.clusterActivationIntensities[clusterIndex] = activation.intensity;
    buffers.clusterActivationOpacities[clusterIndex] = activation.opacity;
    buffers.clusterActivationSizes[clusterIndex] = activation.size;
  }
};

const smoothBufferValue = (value: number): number => {
  const amount = clampBufferValue(value);
  return amount * amount * (3 - 2 * amount);
};

export const writeOperationalProtagonistMarker = (
  buffers: NeuralCorePropagationBufferState,
  pulse: NeuralCorePropagationVisualPulse,
  channel: NeuralCoreOperationalRouteVisualChannel,
  routeDirection: "forward" | "backward",
  routeProgress: number,
  red: number,
  green: number,
  blue: number,
  pulseComposition: NeuralCoreElementVisualComposition,
): number => {
  const field = buffers.operationalProtagonistMarkerField;
  const protagonistConfig = NEURAL_CORE_OPERATIONAL_PROTAGONIST_MARKER_CONFIG;
  const markerOpacity = clampBufferValue(Math.max(
    protagonistConfig.minimumOpacity,
    pulseComposition.opacity,
  ));
  const markerSize = pulse.size
    * pulseComposition.scale
    * protagonistConfig.markerScaleMultiplier;
  writeNeuralCoreOperationalRoutePositionAtProgress(
    field.positions,
    0,
    channel,
    routeProgress,
    buffers.operationalRouteScratchPoint,
  );
  writeNeuralCoreOperationalRouteTangentAtProgress(
    buffers.operationalRouteTangentScratchPoint,
    channel,
    routeProgress,
    routeDirection,
    buffers.operationalRoutePreviousScratchPoint,
    buffers.operationalRouteNextScratchPoint,
  );
  field.tangents[0] = buffers.operationalRouteTangentScratchPoint[0];
  field.tangents[1] = buffers.operationalRouteTangentScratchPoint[1];
  field.tangents[2] = buffers.operationalRouteTangentScratchPoint[2];
  field.colors[0] = red;
  field.colors[1] = green;
  field.colors[2] = blue;
  field.opacities[0] = markerOpacity;
  field.sizes[0] = markerSize;
  return 1;
};

const writeOperationalEndpointReactions = (
  buffers: NeuralCorePropagationBufferState,
  channel: NeuralCoreOperationalRouteVisualChannel,
  progress: number,
  red: number,
  green: number,
  blue: number,
): void => {
  const protagonistConfig = NEURAL_CORE_OPERATIONAL_PROTAGONIST_MARKER_CONFIG;
  const reactionState = buffers.operationalEndpointReactionState;
  const sourceWeight = 1 - smoothBufferValue(
    progress / protagonistConfig.sourceReactionProgressFraction,
  );
  const destinationStart = 1 - protagonistConfig.destinationReactionProgressFraction;
  const anticipationWeight = smoothBufferValue(
    (progress - destinationStart)
      / protagonistConfig.destinationReactionProgressFraction,
  );
  const arrivalStart = 1 - protagonistConfig.arrivalReactionProgressFraction;
  const arrivalWeight = smoothBufferValue(
    (progress - arrivalStart) / protagonistConfig.arrivalReactionProgressFraction,
  );
  reactionState.sourceClusterId = channel.sourceClusterId;
  reactionState.sourceWeight = sourceWeight
    * protagonistConfig.sourceReactionIntensity;
  reactionState.targetClusterId = channel.targetClusterId;
  reactionState.targetWeight = anticipationWeight
    * (
      protagonistConfig.destinationAnticipationIntensityRatio
      + arrivalWeight
        * (1 - protagonistConfig.destinationAnticipationIntensityRatio)
    )
    * protagonistConfig.destinationReactionIntensity;
  reactionState.red = red;
  reactionState.green = green;
  reactionState.blue = blue;
};

export const updateNeuralCorePropagationBuffers = (
  buffers: NeuralCorePropagationBufferState,
  visualState: NeuralCorePropagationVisualState,
  _topologyVisualState: NeuralCoreTopologyVisualState,
  pulseTrailPointCount: number,
  directionState: NeuralCoreSceneDirectionState,
  directionConfig: NeuralCoreSceneDirectionConfig,
  config: NeuralCorePropagationConfig,
  cameraProfile: NeuralCoreCameraRenderingProfile,
  inspectionVisibility: NeuralCoreInspectionVisibilityState,
  operationalRouteVisualChannel?: NeuralCoreOperationalRouteVisualChannel,
  operationalTransmissionId?: string,
): NeuralCorePropagationBufferUpdateResult => {
  compileDirectionFocusLevels(buffers, directionState);
  buffers.operationalProtagonistMarkerField.opacities[0] = 0;
  buffers.operationalProtagonistMarkerField.sizes[0] = 0;
  const operationalEndpointReactionState = buffers.operationalEndpointReactionState;
  operationalEndpointReactionState.sourceClusterId = undefined;
  operationalEndpointReactionState.sourceWeight = 0;
  operationalEndpointReactionState.targetClusterId = undefined;
  operationalEndpointReactionState.targetWeight = 0;
  operationalEndpointReactionState.red = 0;
  operationalEndpointReactionState.green = 0;
  operationalEndpointReactionState.blue = 0;
  let pulsePointCount = 0;
  let operationalProtagonistMarkerCount = 0;
  let operationalProtagonistWritten = false;
  let operationalProtagonistProgress = -1;
  let operationalProtagonistRed = 0;
  let operationalProtagonistGreen = 0;
  let operationalProtagonistBlue = 0;
  for (const pulse of visualState.pulses) {
    const isOperationalProtagonist = operationalTransmissionId !== undefined
      && pulse.transmissionId === operationalTransmissionId;
    if (isOperationalProtagonist && operationalProtagonistWritten) {
      continue;
    }
    const route = buffers.routesBySynapseId[pulse.synapseId];
    if (!route && !(isOperationalProtagonist && operationalRouteVisualChannel)) {
      continue;
    }

    const operationalStatus = operationalRouteVisualChannel?.status === "recovering"
      ? "warning"
      : operationalRouteVisualChannel?.status;
    const pulseColor = isOperationalProtagonist && operationalStatus
      ? NEURAL_CORE_TOPOLOGY_STATUS_COLORS[operationalStatus]
      : pulse.color;
    const packedColor = getPackedColor(buffers.packedColorByHex, pulseColor);
    const red = getPackedColorRed(packedColor);
    const green = getPackedColorGreen(packedColor);
    const blue = getPackedColorBlue(packedColor);
    const synapseIndex = buffers.synapseIndexById[pulse.synapseId];
    const focusLevel = synapseIndex === undefined
      ? 0
      : buffers.synapseFocusLevels[synapseIndex];
    const focusOpacity = directionState.isOverview
      ? 1
      : focusLevel >= 2
        ? 1 + directionState.routeEmphasis * 0.42
        : focusLevel === 1
          ? 1 + directionState.routeEmphasis * 0.18
          : getPeripheralFocusOpacity(
            directionState,
            directionConfig,
            directionConfig.focus.contextConnectionOpacity,
          );
    const focusSize = directionState.isOverview
      ? 1
      : focusLevel >= 2
        ? 1 + directionState.routeEmphasis * 0.28
        : focusLevel === 1 ? 1.08 : 0.92;
    const pulseVisibilityRole = inspectionVisibility.enabled && focusLevel >= 1
      ? "related"
      : resolveNeuralCoreInspectionVisibilityRole(focusLevel);
    const pulseComposition = writeNeuralCoreElementVisualComposition(
      PROPAGATION_VISUAL_COMPOSITION,
      pulseVisibilityRole,
      "pulse",
      clampBufferValue(pulse.opacity * focusOpacity),
      1,
      focusSize,
      1,
      1,
      1,
      1,
      1,
      cameraProfile,
      inspectionVisibility,
    );
    const pulseOpacity = pulseComposition.opacity;
    const routeDirection = isOperationalProtagonist
      && operationalRouteVisualChannel?.direction !== "bidirectional"
      && operationalRouteVisualChannel?.direction !== undefined
      ? operationalRouteVisualChannel.direction
      : pulse.direction;
    const routeProgress = routeDirection === "forward"
      ? pulse.progress
      : 1 - pulse.progress;
    if (isOperationalProtagonist && operationalRouteVisualChannel) {
      const protagonistRed = convertSrgbChannelToLinear(red);
      const protagonistGreen = convertSrgbChannelToLinear(green);
      const protagonistBlue = convertSrgbChannelToLinear(blue);
      operationalProtagonistMarkerCount = writeOperationalProtagonistMarker(
        buffers,
        pulse,
        operationalRouteVisualChannel,
        routeDirection,
        routeProgress,
        protagonistRed,
        protagonistGreen,
        protagonistBlue,
        pulseComposition,
      );
      operationalProtagonistWritten = operationalProtagonistMarkerCount > 0;
      if (operationalProtagonistWritten) {
        operationalProtagonistProgress = pulse.progress;
        operationalProtagonistRed = protagonistRed;
        operationalProtagonistGreen = protagonistGreen;
        operationalProtagonistBlue = protagonistBlue;
      }
      continue;
    }
    for (
      let trailIndex = 0;
      trailIndex < pulseTrailPointCount
        && pulsePointCount < buffers.pulseField.maximumPointCount;
      trailIndex += 1
    ) {
      const trailFraction = pulseTrailPointCount <= 1
        ? 0
        : trailIndex / (pulseTrailPointCount - 1);
      const smoothTrailFraction = trailFraction * (1.35 - trailFraction * 0.35);
      const trailOffset = pulse.trailLength * smoothTrailFraction;
      const pointProgress = routeDirection === "forward"
        ? routeProgress - trailOffset
        : routeProgress + trailOffset;
      const isHead = trailIndex === 0;
      const trailOpacity = clampBufferValue(
        pulseOpacity
          * Math.pow(1 - trailFraction, config.pulse.trailOpacityFalloff),
      );
      const trailSize = pulse.size
        * pulseComposition.scale
        * (isHead ? config.pulse.headScale : 1 - trailFraction * 0.54);
      const brightness = isHead ? config.pulse.headBrightness : 1;
      if (route) {
        writeNeuralCoreRoutePositionAtProgress(
          buffers.pulseField.positions,
          pulsePointCount,
          route,
          pointProgress,
        );
      }
      writePointAppearance(
        buffers.pulseField,
        pulsePointCount,
        red * brightness,
        green * brightness,
        blue * brightness,
        trailOpacity,
        trailSize,
      );
      pulsePointCount += 1;
    }
  }

  compileClusterFrameState(buffers, visualState);
  if (
    operationalRouteVisualChannel
    && operationalProtagonistProgress >= 0
  ) {
    writeOperationalEndpointReactions(
      buffers,
      operationalRouteVisualChannel,
      operationalProtagonistProgress,
      operationalProtagonistRed,
      operationalProtagonistGreen,
      operationalProtagonistBlue,
    );
  }
  let clusterPointCount = 0;
  buffers.clusterRegions.forEach((region, clusterIndex): void => {
    const intensity = buffers.clusterActivationIntensities[clusterIndex];
    if (intensity <= 0) {
      return;
    }

    const colorOffset = clusterIndex * 3;
    const red = buffers.clusterActivationColors[colorOffset];
    const green = buffers.clusterActivationColors[colorOffset + 1];
    const blue = buffers.clusterActivationColors[colorOffset + 2];
    const opacity = buffers.clusterActivationOpacities[clusterIndex];
    const size = buffers.clusterActivationSizes[clusterIndex];
    const focusLevel = buffers.clusterFocusLevels[clusterIndex];
    const focusOpacity = directionState.isOverview
      ? 1
      : focusLevel >= 2
        ? 1 + directionState.targetEmphasis * 0.3
        : focusLevel === 1
          ? 1 + directionState.targetEmphasis * 0.08
          : getPeripheralFocusOpacity(
            directionState,
            directionConfig,
            directionConfig.focus.contextNodeOpacity,
          );
    const focusSize = directionState.isOverview
      ? 1
      : focusLevel >= 2
        ? 1 + directionState.targetEmphasis * 0.24
        : focusLevel === 1 ? 1.06 : 0.92;
    const activationComposition = writeNeuralCoreElementVisualComposition(
      PROPAGATION_VISUAL_COMPOSITION,
      resolveNeuralCoreInspectionVisibilityRole(focusLevel),
      "pulse",
      clampBufferValue(opacity * focusOpacity),
      1,
      focusSize,
      1,
      1,
      1,
      1,
      1,
      cameraProfile,
      inspectionVisibility,
    );
    const activationOpacity = activationComposition.opacity;

    for (const nodeId of region.nodeIds) {
      if (nodeId >= 0 && nodeId < buffers.nodeActivationById.length) {
        buffers.nodeActivationById[nodeId] = Math.max(
          buffers.nodeActivationById[nodeId],
          intensity,
        );
      }

      const position = buffers.nodePositionsById[nodeId];
      if (!position || clusterPointCount >= buffers.clusterField.maximumPointCount) {
        continue;
      }

      writePoint(
        buffers.clusterField,
        clusterPointCount,
        position,
        red,
        green,
        blue,
        activationOpacity,
        size * activationComposition.scale,
      );
      clusterPointCount += 1;
    }

    for (const nodeId of region.hubNodeIds) {
      if (nodeId < 0 || nodeId >= buffers.nodeActivationById.length) {
        continue;
      }
      buffers.nodeActivationById[nodeId] = Math.max(
        buffers.nodeActivationById[nodeId],
        intensity,
      );
    }
  });

  buffers.updateResult.clusterPointCount = clusterPointCount;
  buffers.updateResult.operationalProtagonistMarkerCount =
    operationalProtagonistMarkerCount;
  buffers.updateResult.pulsePointCount = pulsePointCount;
  return buffers.updateResult;
};

export const createNeuralCorePropagationBufferDimensionsKey = (
  config: NeuralCorePropagationConfig,
): string => {
  return [
    config.runtime.maximumConcurrentTransmissions,
    config.pulse.trailSampleCount,
  ].join(":");
};
