import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ComponentRef,
  type ReactElement,
  type RefObject,
} from "react";
import { Color, Fog, type
  BufferAttribute,
  BufferGeometry,
  Group,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Points,
  Raycaster,
  ShaderMaterial,
  Sphere,
  Vector2,
  Vector3,
} from "three";

import {
  createNeuralCorePropagationBufferState,
  createNeuralCorePropagationBufferDimensionsKey,
  updateNeuralCorePropagationBuffers,
} from "../../visualization/propagation/neural-core-propagation-buffer.utils";
import type { NeuralCorePropagationVisualState } from "../../visualization/propagation/neural-core-propagation-visual.types";
import type {
  NeuralCoreOperationalEndpointReactionState,
} from "../../visualization/propagation/neural-core-propagation-buffer.types";
import { useNeuralCorePropagation } from "../../hooks/use-neural-core-propagation/use-neural-core-propagation.hook";
import { createNeuralCoreGraph } from "../../visualization/graph/neural-core-graph.utils";
import { mapNeuralCoreTopologyToVisualState } from "../../visualization/topology/neural-core-topology-visual.mapper";
import { useNeuralCoreChoreography } from "../../hooks/use-neural-core-choreography/use-neural-core-choreography.hook";
import {
  createNeuralCoreSemanticBufferDimensionsKey,
  createNeuralCoreSemanticBufferState,
  updateNeuralCoreSemanticBuffers,
} from "../../visualization/semantic/neural-core-semantic-buffer.utils";
import {
  createNeuralCoreSemanticVisualRuntime,
  updateNeuralCoreSemanticVisualRuntime,
} from "../../visualization/semantic/neural-core-semantic-visual.mapper";
import { EMPTY_NEURAL_CORE_SEMANTIC_VISUAL_STATE } from "../../visualization/semantic/neural-core-semantic-visual.constants";
import { dampNeuralCoreValue } from "../../visualization/semantic/neural-core-semantic-transition.utils";
import type {
  NeuralCoreSemanticBufferState,
  NeuralCoreSemanticNodeField,
} from "../../visualization/semantic/neural-core-semantic-buffer.types";
import type {
  NeuralCoreParticle,
  NeuralCorePulse,
  NeuralCoreVector3,
} from "../../visualization/graph/neural-core-graph.types";
import { useNeuralCoreSceneDirection } from "../../hooks/use-neural-core-scene-direction/use-neural-core-scene-direction.hook";
import { useNeuralCoreNarrative } from "../../hooks/use-neural-core-narrative/use-neural-core-narrative.hook";
import { mapNeuralCoreNarrativeToVisualState } from "../../visualization/narrative/neural-core-narrative-visual.mapper";
import {
  dampNeuralCoreSceneDirectionAngle,
  dampNeuralCoreSceneDirectionValue,
} from "../../visualization/direction/neural-core-scene-direction.utils";
import { NeuralCoreSceneView } from "./neural-core-scene-view.component";
import type { NeuralCoreSceneProps } from "./neural-core-scene-view.types";
import { EMPTY_NEURAL_CORE_TOPOLOGY } from "../../domain/topology/neural-core-topology.constants";
import {
  createNeuralCoreSpatialIdentityKey,
  createNeuralCoreSpatialMap,
} from "../../visualization/spatial/neural-core-spatial-map.mapper";
import type { NeuralCoreSpatialMap } from "../../visualization/spatial/neural-core-spatial-map.types";
import { useNeuralCoreClusterLabels } from "../../hooks/use-neural-core-cluster-labels/use-neural-core-cluster-labels.hook";
import { NeuralCoreClusterLabelOverlay } from "../neural-core-cluster-label-overlay/neural-core-cluster-label-overlay.component";
import { mapNeuralCoreInspectionDirectionState } from "../../visualization/inspection/neural-core-inspection-focus.mapper";
import { isNeuralCoreInspectionPickCandidateBetter } from "../../visualization/inspection/neural-core-inspection-focus.utils";
import type { NeuralCoreInspectionPickCandidate } from "../../visualization/inspection/neural-core-inspection-focus.types";
import { resolveNeuralCoreSimulationDelta } from "../../domain/inspection/neural-core-inspection.utils";
import {
  createNeuralCoreVisualDensityRuntime,
  updateNeuralCoreVisualDensityRuntime,
} from "../../visualization/inspection/neural-core-visual-density.utils";
import { mapNeuralCoreInspectionVisibilityState } from "../../visualization/inspection/neural-core-inspection-visibility.mapper";
import { updateNeuralCoreInspectionVisibilityState } from "../../visualization/inspection/neural-core-inspection-visibility.utils";
import {
  createNeuralCoreCameraRenderingProfile,
  updateNeuralCoreCameraRenderingProfile,
} from "../../visualization/inspection/neural-core-camera-rendering.utils";
import type { NeuralCoreElementVisualComposition } from "../../visualization/inspection/neural-core-element-visual-composition.types";
import { writeNeuralCoreElementVisualComposition } from "../../visualization/inspection/neural-core-element-visual-composition.utils";
import { mapNeuralCoreClusterGrammar } from "../../visualization/cluster-grammar/neural-core-cluster-grammar.mapper";
import {
  createNeuralCoreClusterGrammarBufferState,
  createNeuralCoreClusterGrammarRuntime,
  updateNeuralCoreClusterGrammarBuffers,
  updateNeuralCoreClusterGrammarRuntime,
} from "../../visualization/cluster-grammar/neural-core-cluster-expansion.mapper";
import {
  createNeuralCoreAggregatedPulseField,
  createNeuralCoreAggregatedRouteRenderField,
  updateNeuralCoreAggregatedPulseField,
  updateNeuralCoreAggregatedRouteRenderField,
} from "../../visualization/cluster-grammar/neural-core-cluster-grammar-render.mapper";
import type {
  NeuralCoreAggregatedRoute,
  NeuralCoreClusterGrammarDensity,
  NeuralCoreClusterGrammarFocus,
} from "../../visualization/cluster-grammar/neural-core-cluster-grammar.types";
import {
  mapNeuralCoreAggregatedRoutes,
} from "../../visualization/cluster-grammar/neural-core-aggregated-route.mapper";
import {
  NeuralCoreClusterTerritoriesView,
} from "../neural-core-cluster-territories/neural-core-cluster-territories-view.component";
import {
  NeuralCoreAggregatedRoutesView,
} from "../neural-core-aggregated-routes/neural-core-aggregated-routes-view.component";
import {
  createNeuralCoreSemanticFocusLensRuntime,
  writeNeuralCoreSemanticFocusLensTarget,
} from "../../visualization/focus-lens/neural-core-semantic-focus-lens.mapper";
import {
  updateNeuralCoreSemanticFocusLensRuntime,
} from "../../visualization/focus-lens/neural-core-semantic-focus-lens.utils";
import type {
  WriteNeuralCoreSemanticFocusLensTargetParams,
} from "../../visualization/focus-lens/neural-core-semantic-focus-lens.types";
import {
  NEURAL_CORE_TOPOLOGY_STATUS_COLORS,
} from "../../visualization/topology/neural-core-topology-visual.constants";
import {
  mapOperationalRouteEventToVisualChannel,
} from "../../demos/operational/mappers/neural-core-operational-route-visual-channel.mapper";
import {
  mapOperationalVisualChannelToPropagation,
} from "../../demos/operational/mappers/neural-core-operational-propagation.mapper";
import {
  NEURAL_CORE_OPERATIONAL_PROTAGONIST_MARKER_CONFIG,
} from "../../visualization/propagation/neural-core-operational-protagonist-marker.constants";

const EMPTY_NEURAL_CORE_CLUSTER_IDS: readonly string[] = [];
const EMPTY_NEURAL_CORE_AGGREGATED_ROUTES: readonly NeuralCoreAggregatedRoute[] = [];
const EMPTY_NEURAL_CORE_ROUTE_INDEX_BY_SYNAPSE_ID: Readonly<
  Record<string, number>
> = {};

const createOperationalRouteIndexBySynapseId = (
  routes: readonly NeuralCoreAggregatedRoute[],
): Readonly<Record<string, number>> => {
  const routeIndexBySynapseId: Record<string, number> = {};
  routes.forEach((route, routeIndex): void => {
    for (const synapseId of route.synapseIds) {
      routeIndexBySynapseId[synapseId] = routeIndex;
    }
  });
  return routeIndexBySynapseId;
};

interface NeuralCoreSceneMotionRuntime {
  particleTime: number;
  rotationSpeed: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  smoothedActivity: number;
  smoothedBreathingMultiplier: number;
  smoothedParticleMultiplier: number;
  smoothedRotationMultiplier: number;
}

interface NeuralCoreSceneChoreographyLoopRuntime {
  choreographyId?: string;
  timelineSeconds: number;
}

type NeuralCoreCameraTransitionKind = "focus" | "overview" | "presentation";

interface NeuralCoreCameraTransitionRuntime {
  active: boolean;
  elapsedSeconds: number;
  durationSeconds: number;
  kind: NeuralCoreCameraTransitionKind;
  startPosition: Vector3;
  startTarget: Vector3;
  endPosition: Vector3;
  endTarget: Vector3;
}

interface NeuralCorePointerRuntime {
  clientX: number;
  clientY: number;
  pointerId: number;
}

const PRESENTATION_FOG_NEAR = 3.9;
const PRESENTATION_FOG_FAR = 6.8;

const SCENE_VISUAL_COMPOSITION: NeuralCoreElementVisualComposition = {
  opacity: 1,
  brightness: 1,
  scale: 1,
  thickness: 1,
};

const POINT_CLOUD_SEMANTIC_ATTRIBUTE_NAMES = [
  "aSemanticTint",
  "aSemanticBrightness",
  "aSemanticColorInfluence",
  "aSemanticScale",
  "aSemanticOpacity",
  "aSemanticJitter",
  "aSemanticFragmentation",
  "aSemanticDecay",
  "aSemanticFill",
  "aSemanticSynchronization",
  "aSemanticPulseFrequency",
  "aSemanticPulseAmplitude",
] as const;

const smoothStep = (minimum: number, maximum: number, value: number): number => {
  if (maximum <= minimum) {
    return value >= maximum ? 1 : 0;
  }
  const amount = Math.min(1, Math.max(0, (value - minimum) / (maximum - minimum)));
  return amount * amount * (3 - 2 * amount);
};

const writeRotatedSceneVector = (
  source: NeuralCoreVector3,
  rotationX: number,
  rotationY: number,
  rotationZ: number,
  scale: number,
  target: NeuralCoreVector3,
): void => {
  const sourceX = source[0] * scale;
  const sourceY = source[1] * scale;
  const sourceZ = source[2] * scale;
  const cosineX = Math.cos(rotationX);
  const sineX = Math.sin(rotationX);
  const afterXy = sourceY * cosineX - sourceZ * sineX;
  const afterXz = sourceY * sineX + sourceZ * cosineX;
  const cosineY = Math.cos(rotationY);
  const sineY = Math.sin(rotationY);
  const afterYx = sourceX * cosineY + afterXz * sineY;
  const afterYz = -sourceX * sineY + afterXz * cosineY;
  const cosineZ = Math.cos(rotationZ);
  const sineZ = Math.sin(rotationZ);
  target[0] = afterYx * cosineZ - afterXy * sineZ;
  target[1] = afterYx * sineZ + afterXy * cosineZ;
  target[2] = afterYz;
};

const animatePulseGroup = (
  group: Group,
  elapsedTime: number,
  baseIntensity: number,
  nodeActivationById: Float32Array,
  nodeBufferIndexById: Int32Array,
  nodeField: NeuralCoreSemanticNodeField,
  maximumFragmentationDistance: number,
  decayThresholdSpread: number,
  grammarOpacityByGraphIndex?: Float32Array,
): void => {
  for (const child of group.children) {
    const phase = child.userData.phase;
    const baseScale = child.userData.baseScale;
    const nodeId = child.userData.nodeId;
    const basePosition = child.userData.basePosition;

    if (
      typeof phase !== "number"
      || typeof baseScale !== "number"
      || typeof nodeId !== "number"
      || !Array.isArray(basePosition)
    ) {
      continue;
    }

    const localActivation = nodeId < nodeActivationById.length
      ? nodeActivationById[nodeId]
      : 0;
    const nodeIndex = nodeId < nodeBufferIndexById.length
      ? nodeBufferIndexById[nodeId]
      : -1;
    const semanticScale = nodeIndex >= 0 ? nodeField.scales[nodeIndex] : 1;
    const semanticOpacity = nodeIndex >= 0 ? nodeField.opacities[nodeIndex] : 1;
    const semanticBrightness = nodeIndex >= 0 ? nodeField.brightnesses[nodeIndex] : 1;
    const semanticDecay = nodeIndex >= 0 ? nodeField.decays[nodeIndex] : 0;
    const fragmentation = nodeIndex >= 0 ? nodeField.fragmentations[nodeIndex] : 0;
    const colorInfluence = nodeIndex >= 0 ? nodeField.colorInfluences[nodeIndex] : 0;
    const seed = nodeIndex >= 0 ? nodeField.seeds[nodeIndex] : 0.5;
    const spread = Math.max(0.02, decayThresholdSpread);
    const brightnessDecay = smoothStep(seed - spread, seed, semanticDecay);
    const sizeDecay = smoothStep(
      seed - spread * 0.35,
      seed + spread * 0.35,
      semanticDecay,
    );
    const opacityDecay = smoothStep(seed, seed + spread, semanticDecay);
    const directionX = Math.sin(seed * 91.7 + 0.4);
    const directionY = Math.sin(seed * 157.3 + 1.7);
    const directionZ = Math.sin(seed * 233.9 + 3.1);
    const directionLength = Math.max(0.0001, Math.hypot(directionX, directionY, directionZ));
    const fragmentationDistance = fragmentation * maximumFragmentationDistance
      * (0.35 + seed * 0.65);
    child.position.set(
      Number(basePosition[0]) + directionX / directionLength * fragmentationDistance,
      Number(basePosition[1]) + directionY / directionLength * fragmentationDistance,
      Number(basePosition[2]) + directionZ / directionLength * fragmentationDistance,
    );
    const pulse = Math.sin(elapsedTime * (0.92 + localActivation * 0.42) + phase);
    child.scale.setScalar(
      baseScale * semanticScale * (1 - sizeDecay * 0.68)
        * (1 + pulse * baseIntensity + localActivation * (0.08 + pulse * 0.025)),
    );

    for (const meshChild of child.children) {
      const mesh = meshChild as Mesh;
      const material = mesh.material as MeshBasicMaterial;
      const baseColor = material.userData.baseColor;
      const baseOpacity = material.userData.baseOpacity;
      if (
        !Array.isArray(baseColor)
        || baseColor.length < 3
        || typeof baseOpacity !== "number"
      ) {
        continue;
      }
      const colorOffset = nodeIndex * 3;
      const semanticRed = nodeIndex >= 0 ? nodeField.colors[colorOffset] : 0.5;
      const semanticGreen = nodeIndex >= 0 ? nodeField.colors[colorOffset + 1] : 0.92;
      const semanticBlue = nodeIndex >= 0 ? nodeField.colors[colorOffset + 2] : 1;
      const brightness = semanticBrightness * (1 - brightnessDecay * 0.55);
      const baseRed = Number(baseColor[0]);
      const baseGreen = Number(baseColor[1]);
      const baseBlue = Number(baseColor[2]);
      material.color.setRGB(
        (baseRed + (semanticRed - baseRed) * colorInfluence) * brightness,
        (baseGreen + (semanticGreen - baseGreen) * colorInfluence) * brightness,
        (baseBlue + (semanticBlue - baseBlue) * colorInfluence) * brightness,
      );
      const grammarOpacity = grammarOpacityByGraphIndex && nodeIndex >= 0
        ? grammarOpacityByGraphIndex[nodeIndex]
        : 1;
      material.opacity = baseOpacity * semanticOpacity
        * (1 - opacityDecay * 0.96) * grammarOpacity;
    }
  }
};

const animateRingGroup = (group: Group, elapsedTime: number): void => {
  group.rotation.y = elapsedTime * 0.018;
  group.rotation.x = Math.sin(elapsedTime * 0.12) * 0.035;

  group.children.forEach((child): void => {
    const speed = child.userData.speed;
    const phase = child.userData.phase;

    if (typeof speed !== "number" || typeof phase !== "number") {
      return;
    }

    child.rotation.z = elapsedTime * speed + phase;
  });
};

const updateParticlePositions = (
  attribute: BufferAttribute,
  particles: NeuralCoreParticle[],
  animationTime: number,
): void => {
  const positions = attribute.array;

  if (!(positions instanceof Float32Array)) {
    return;
  }

  particles.forEach((particle, index): void => {
    const offset = index * 3;
    const phase = particle.phase + animationTime * particle.speed;

    positions[offset] = particle.basePosition[0] + Math.sin(phase) * particle.drift[0];
    positions[offset + 1] = particle.basePosition[1] + Math.cos(phase * 0.77) * particle.drift[1];
    positions[offset + 2] = particle.basePosition[2] + Math.sin(phase * 0.63) * particle.drift[2];
  });

  attribute.needsUpdate = true;
};

const updateAmbientPulseAttributes = (
  positionAttribute: BufferAttribute,
  colorAttribute: BufferAttribute,
  pulses: NeuralCorePulse[],
  elapsedTime: number,
): void => {
  const positions = positionAttribute.array;
  const colors = colorAttribute.array;

  if (!(positions instanceof Float32Array) || !(colors instanceof Float32Array)) {
    return;
  }

  pulses.forEach((pulse, index): void => {
    const offset = index * 3;
    const routeProgress = pulse.phase + elapsedTime * pulse.speed;
    const routeIndex = Math.floor(routeProgress) % pulse.routes.length;
    const progress = routeProgress - Math.floor(routeProgress);
    const route = pulse.routes[routeIndex];
    const ease = progress * progress * (3 - 2 * progress);
    const fade = Math.sin(progress * Math.PI);
    const routeCenterBoost = 1 - Math.abs(progress - 0.5) * 2;
    const shimmer = Math.sin((elapsedTime * 2.2 + pulse.phase) * Math.PI) * 0.011;
    const packedColor = Number.parseInt(pulse.color.replace("#", ""), 16);
    const red = ((packedColor >> 16) & 255) / 255;
    const green = ((packedColor >> 8) & 255) / 255;
    const blue = (packedColor & 255) / 255;
    const intensity = 0.18 + Math.pow(fade, 0.72) * 1.82 + routeCenterBoost * 0.12;

    positions[offset] = route.from[0] + (route.to[0] - route.from[0]) * ease + shimmer;
    positions[offset + 1] = route.from[1] + (route.to[1] - route.from[1]) * ease;
    positions[offset + 2] = route.from[2] + (route.to[2] - route.from[2]) * ease - shimmer;

    colors[offset] = red * intensity;
    colors[offset + 1] = green * intensity;
    colors[offset + 2] = blue * intensity;
  });

  positionAttribute.needsUpdate = true;
  colorAttribute.needsUpdate = true;
};

const markAttributeForUpdate = (
  attribute: { needsUpdate: boolean } | null | undefined,
): void => {
  if (attribute) {
    attribute.needsUpdate = true;
  }
};

const updatePointCloudMaterials = (
  group: Group | null,
  elapsedTime: number,
  pointScale: number,
  markAttributes: boolean,
): void => {
  if (!group) {
    return;
  }

  for (const child of group.children) {
    const points = child as Points;
    const material = points.material as ShaderMaterial;
    if (material.uniforms.uTime) {
      material.uniforms.uTime.value = elapsedTime;
    }
    if (material.uniforms.uPointScale) {
      material.uniforms.uPointScale.value = pointScale;
    }
    if (!markAttributes) {
      continue;
    }
    for (const attributeName of POINT_CLOUD_SEMANTIC_ATTRIBUTE_NAMES) {
      markAttributeForUpdate(points.geometry.getAttribute(attributeName));
    }
  }
};

const markConnectionAttributesForUpdate = (group: Group | null): void => {
  if (!group) {
    return;
  }
  for (const child of group.children) {
    const line = child as LineSegments;
    markAttributeForUpdate(line.geometry.getAttribute("aSemanticColor"));
    markAttributeForUpdate(line.geometry.getAttribute("aSemanticOpacity"));
  }
};

const updateDecorativeGroupOpacity = (
  group: Group | null,
  weight: number,
  response: number,
  deltaSeconds: number,
): void => {
  if (!group) {
    return;
  }
  for (const child of group.children) {
    const mesh = child as Mesh;
    const material = mesh.material as MeshBasicMaterial;
    const baseOpacity = material.userData.baseOpacity;
    if (typeof baseOpacity !== "number") {
      continue;
    }
    material.opacity = dampNeuralCoreSceneDirectionValue(
      material.opacity,
      baseOpacity * weight,
      response,
      deltaSeconds,
    );
  }
};

const updateClusterTerritoryVisuals = (
  territoryRefs: readonly RefObject<Group | null>[],
  clusterStates: readonly {
    territoryOpacity: number;
    territoryScale: number;
    boundaryOpacity: number;
    hubOpacity: number;
    hubScale: number;
    activityIntensity: number;
  }[],
  endpointReaction: NeuralCoreOperationalEndpointReactionState,
  elapsedSeconds: number,
): void => {
  territoryRefs.forEach((territoryRef, index): void => {
    const group = territoryRef.current;
    const state = clusterStates[index];
    if (!group || !state) {
      return;
    }
    const clusterId = typeof group.userData.clusterId === "string"
      ? group.userData.clusterId
      : undefined;
    const sourceReactionWeight = clusterId === endpointReaction.sourceClusterId
      ? endpointReaction.sourceWeight
      : 0;
    const targetReactionWeight = clusterId === endpointReaction.targetClusterId
      ? endpointReaction.targetWeight
      : 0;
    const endpointReactionWeight = Math.max(
      sourceReactionWeight,
      targetReactionWeight,
    );
    const activityIntensity = Math.max(
      state.activityIntensity,
      endpointReactionWeight,
    );
    group.scale.setScalar(state.territoryScale);
    const boundary = group.children[0] as Mesh | undefined;
    const boundaryMaterial = boundary?.material as ShaderMaterial | undefined;
    if (boundaryMaterial?.uniforms.uOpacity) {
      boundaryMaterial.uniforms.uOpacity.value = Math.min(
        1,
        state.boundaryOpacity * state.territoryOpacity
          + endpointReactionWeight * 0.035,
      );
    }
    const boundaryColor = boundaryMaterial?.uniforms.uColor?.value;
    const boundarySemanticColor = boundaryMaterial?.userData.semanticColor;
    if (boundaryColor instanceof Color && boundarySemanticColor instanceof Color) {
      const reactionColorWeight = endpointReactionWeight * 0.14;
      boundaryColor.setRGB(
        boundarySemanticColor.r
          + (endpointReaction.red - boundarySemanticColor.r) * reactionColorWeight,
        boundarySemanticColor.g
          + (endpointReaction.green - boundarySemanticColor.g) * reactionColorWeight,
        boundarySemanticColor.b
          + (endpointReaction.blue - boundarySemanticColor.b) * reactionColorWeight,
      );
    }
    const hub = group.children[1] as Group | undefined;
    if (!hub) {
      return;
    }
    const pulse = 1 + Math.sin(elapsedSeconds * (0.72 + activityIntensity * 0.5) + index)
      * 0.025 * activityIntensity;
    hub.scale.setScalar(
      state.hubScale * pulse * (1 + endpointReactionWeight * 0.1),
    );
    hub.rotation.z = elapsedSeconds * 0.08 * (0.4 + activityIntensity);
    for (const child of hub.children) {
      const mesh = child as Mesh;
      const material = mesh.material as MeshBasicMaterial;
      const role = material.userData.role;
      const roleOpacity = role === "hub-ring"
        ? 0.34
        : role === "hub-filaments" ? 0.2 : 0.82;
      const reactionOpacity = role === "hub-core"
        ? 0.42
        : role === "hub-filaments" ? 0.18 : 0.24;
      material.opacity = Math.min(
        1,
        state.hubOpacity * state.territoryOpacity * roleOpacity
          + endpointReactionWeight * reactionOpacity,
      );
      const semanticColor = material.userData.semanticColor;
      if (semanticColor instanceof Color) {
        const reactionColorWeight = endpointReactionWeight * 0.72;
        material.color.setRGB(
          semanticColor.r
            + (endpointReaction.red - semanticColor.r) * reactionColorWeight,
          semanticColor.g
            + (endpointReaction.green - semanticColor.g) * reactionColorWeight,
          semanticColor.b
            + (endpointReaction.blue - semanticColor.b) * reactionColorWeight,
        );
      }
    }
  });
};

const getPropagationActivity = (visualState: NeuralCorePropagationVisualState): number => {
  let maximumActivity = 0;
  for (const activation of visualState.clusterActivations) {
    maximumActivity = Math.max(maximumActivity, activation.intensity);
  }
  for (const pulse of visualState.pulses) {
    maximumActivity = Math.max(maximumActivity, pulse.intensity);
  }

  return Math.min(1, maximumActivity);
};

export const NeuralCoreScene = ({
  clusterLabelConfig,
  clusterGrammarConfig,
  semanticFocusLensConfig,
  choreography,
  lodConfig,
  narrative,
  narrativeConfig,
  topology,
  propagationConfig,
  sceneDirection,
  sceneDirectionConfig,
  sceneMotionConfig,
  semanticVisualizationConfig,
  spatialMap,
  spatialLayoutConfig,
  onNarrativeStateChange,
  onPropagationEvent,
  runtimeScenarioKey,
  runtimePlaybackStatus,
  runtimePlaybackPaused = false,
  runtimeFocusedClusterId,
  operationalVisualOverlay,
  operationalPropagationInput,
  operationalRouteProgressRef,
  cameraResetRevision,
  inspectionConfig,
  inspectionFocus,
  inspectionState,
  onCameraTransitioningChange,
  onSelectCluster,
}: NeuralCoreSceneProps): ReactElement => {
  const { camera: sceneCamera, gl, scene } = useThree();
  const ambientPulseMaterialRef = useRef<ShaderMaterial | null>(null);
  const baseRef = useRef<Group | null>(null);
  const clusterActivationColorRef = useRef<BufferAttribute | null>(null);
  const clusterActivationGeometryRef = useRef<BufferGeometry | null>(null);
  const clusterActivationPositionRef = useRef<BufferAttribute | null>(null);
  const clusterActivationOpacityRef = useRef<BufferAttribute | null>(null);
  const clusterActivationSizeRef = useRef<BufferAttribute | null>(null);
  const aggregatedPulseColorRef = useRef<BufferAttribute | null>(null);
  const aggregatedPulseGeometryRef = useRef<BufferGeometry | null>(null);
  const aggregatedPulseOpacityRef = useRef<BufferAttribute | null>(null);
  const aggregatedPulsePositionRef = useRef<BufferAttribute | null>(null);
  const aggregatedPulseSizeRef = useRef<BufferAttribute | null>(null);
  const aggregatedRouteOpacityRef = useRef<BufferAttribute | null>(null);
  const aggregatedRouteColorRef = useRef<BufferAttribute | null>(null);
  const aggregatedRouteThicknessRef = useRef<BufferAttribute | null>(null);
  const clusterGrammarRibbonOpacityRef = useRef<BufferAttribute | null>(null);
  const connectionRef = useRef<Group | null>(null);
  const coreRef = useRef<Group | null>(null);
  const focusHaloMaterialRef = useRef<MeshBasicMaterial | null>(null);
  const focusHaloRef = useRef<Mesh | null>(null);
  const selectedEnvelopeMaterialRef = useRef<ShaderMaterial | null>(null);
  const selectedEnvelopeRef = useRef<Mesh | null>(null);
  const hubRef = useRef<Group | null>(null);
  const networkRef = useRef<Group | null>(null);
  const orbitControlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null);
  const nodeCloudRef = useRef<Group | null>(null);
  const particleMaterialRef = useRef<ShaderMaterial | null>(null);
  const particlePositionRef = useRef<BufferAttribute | null>(null);
  const propagationPulseColorRef = useRef<BufferAttribute | null>(null);
  const propagationPulseGeometryRef = useRef<BufferGeometry | null>(null);
  const propagationPulsePositionRef = useRef<BufferAttribute | null>(null);
  const propagationPulseOpacityRef = useRef<BufferAttribute | null>(null);
  const propagationPulseSizeRef = useRef<BufferAttribute | null>(null);
  const operationalProtagonistMarkerColorRef = useRef<BufferAttribute | null>(null);
  const operationalProtagonistMarkerGeometryRef = useRef<BufferGeometry | null>(null);
  const operationalProtagonistMarkerMaterialRef = useRef<ShaderMaterial | null>(null);
  const operationalProtagonistMarkerOpacityRef = useRef<BufferAttribute | null>(null);
  const operationalProtagonistMarkerPositionRef = useRef<BufferAttribute | null>(null);
  const operationalProtagonistMarkerSizeRef = useRef<BufferAttribute | null>(null);
  const operationalProtagonistMarkerTangentRef = useRef<BufferAttribute | null>(null);
  const pulseColorRef = useRef<BufferAttribute | null>(null);
  const pulsePositionRef = useRef<BufferAttribute | null>(null);
  const ringRef = useRef<Group | null>(null);
  const semanticRibbonColorRef = useRef<BufferAttribute | null>(null);
  const semanticRibbonFragmentationRef = useRef<BufferAttribute | null>(null);
  const semanticRibbonInstabilityRef = useRef<BufferAttribute | null>(null);
  const semanticRibbonInterruptionRef = useRef<BufferAttribute | null>(null);
  const semanticRibbonMaterialRef = useRef<ShaderMaterial | null>(null);
  const semanticRibbonOpacityRef = useRef<BufferAttribute | null>(null);
  const semanticRibbonPulseFrequencyRef = useRef<BufferAttribute | null>(null);
  const semanticRibbonPulseIntensityRef = useRef<BufferAttribute | null>(null);
  const semanticRibbonThicknessRef = useRef<BufferAttribute | null>(null);
  const semanticBufferStateRef = useRef<NeuralCoreSemanticBufferState | undefined>(undefined);
  const initialVisualDensityRuntime = useMemo(
    () => createNeuralCoreVisualDensityRuntime(),
    [],
  );
  const initialCameraRenderingProfile = useMemo(
    () => createNeuralCoreCameraRenderingProfile(),
    [],
  );
  const visualDensityRuntimeRef = useRef(initialVisualDensityRuntime);
  const cameraRenderingProfileRef = useRef(initialCameraRenderingProfile);
  const spatialMapRuntimeRef = useRef<NeuralCoreSpatialMap | undefined>(undefined);
  const choreographyLoopRuntimeRef = useRef<NeuralCoreSceneChoreographyLoopRuntime>({
    timelineSeconds: 0,
  });
  const narrativePhaseKeyRef = useRef("");
  const simulationElapsedSecondsRef = useRef(0);
  const runtimeVisualElapsedSecondsRef = useRef(0);
  const aggregatedPulseSuppressionRef = useRef(1);
  const operationalRouteOpacityMultiplierRef = useRef(1);
  const operationalRouteThicknessMultiplierRef = useRef(1);
  const operationalRouteRenderIndexRef = useRef<number | undefined>(undefined);
  const previousRuntimePlaybackStatusRef = useRef(runtimePlaybackStatus);
  if (previousRuntimePlaybackStatusRef.current !== runtimePlaybackStatus) {
    const previousRuntimeStatus = previousRuntimePlaybackStatusRef.current;
    previousRuntimePlaybackStatusRef.current = runtimePlaybackStatus;
    if (
      runtimePlaybackStatus === "running"
      && (
        previousRuntimeStatus === undefined
        || previousRuntimeStatus === "idle"
        || previousRuntimeStatus === "completed"
      )
    ) {
      runtimeVisualElapsedSecondsRef.current = 0;
    }
  }
  const motionRuntimeRef = useRef<NeuralCoreSceneMotionRuntime>({
    particleTime: 0,
    rotationSpeed: 0,
    rotationX: sceneMotionConfig.horizontalOrientationX,
    rotationY: sceneMotionConfig.horizontalOrientationY,
    rotationZ: sceneMotionConfig.horizontalOrientationZ,
    smoothedActivity: 0,
    smoothedBreathingMultiplier: 1,
    smoothedParticleMultiplier: 1,
    smoothedRotationMultiplier: 1,
  });
  const cameraWorldPositionRef = useRef<NeuralCoreVector3>([0, 0, 4.35]);
  const cameraWorldTargetRef = useRef<NeuralCoreVector3>([0, 0, 0]);
  const cameraLocalVectorRef = useRef(new Vector3());
  const cameraDistanceTargetWorldRef = useRef(new Vector3());
  const cameraLocalPositionRef = useRef<NeuralCoreVector3>([0, 0, 4.35]);
  const haloWorldPositionRef = useRef<NeuralCoreVector3>([0, 0, 0]);
  const cameraTransitionRef = useRef<NeuralCoreCameraTransitionRuntime>({
    active: false,
    durationSeconds: inspectionConfig.camera.focusTransitionSeconds,
    elapsedSeconds: 0,
    kind: "overview",
    startPosition: new Vector3(),
    startTarget: new Vector3(),
    endPosition: new Vector3(),
    endTarget: new Vector3(),
  });
  const inspectionWorldCenterRef = useRef(new Vector3());
  const inspectionViewDirectionRef = useRef(new Vector3());
  const pointerRuntimeRef = useRef<NeuralCorePointerRuntime>({
    clientX: 0,
    clientY: 0,
    pointerId: -1,
  });
  const pickingRaycasterRef = useRef(new Raycaster());
  const pickingPointerRef = useRef(new Vector2());
  const pickingSphereRef = useRef(new Sphere());
  const pickingCenterRef = useRef(new Vector3());
  const pickingHitRef = useRef(new Vector3());
  const pickingScaleRef = useRef(new Vector3());
  const inspectionRootRef = useRef<HTMLElement | null>(null);
  const inspectionCssValuesRef = useRef({
    base: "1.000",
    globalGlow: "1.000",
    microFocus: "0.000",
  });
  const clusterGrammarFocusRef = useRef<NeuralCoreClusterGrammarFocus>({
    relatedClusterIds: [],
    narrativeClusterIds: [],
    narrativeSynapseIds: [],
    narrativePathwayIds: [],
  });
  const clusterGrammarDensityRef = useRef<NeuralCoreClusterGrammarDensity>({
    macroWeight: 1,
    mesoWeight: 0,
    microWeight: 0,
  });
  const focusLensParamsRef = useRef<WriteNeuralCoreSemanticFocusLensTargetParams>({
    interactionMode: "presentation",
    cameraDistanceToBrain: 4.35,
    densityWeights: clusterGrammarDensityRef.current,
  });
  const focusLensRuntime = useMemo(() => {
    return createNeuralCoreSemanticFocusLensRuntime(semanticFocusLensConfig);
  }, [semanticFocusLensConfig]);
  const focusLensTarget = useMemo(() => {
    return createNeuralCoreSemanticFocusLensRuntime(semanticFocusLensConfig);
  }, [semanticFocusLensConfig]);
  const haloTargetColor = useMemo(() => new Color("#82efff"), []);
  const graph = useMemo(() => createNeuralCoreGraph(), []);
  const spatialTopology = topology ?? EMPTY_NEURAL_CORE_TOPOLOGY;
  const spatialIdentityKey = useMemo(() => {
    return createNeuralCoreSpatialIdentityKey(
      spatialTopology,
      spatialLayoutConfig,
      spatialMap,
    );
  }, [spatialLayoutConfig, spatialMap, spatialTopology]);
  const resolvedSpatialMap = useMemo(() => {
    return createNeuralCoreSpatialMap({
      topology: spatialTopology,
      config: spatialLayoutConfig,
      explicitMap: spatialMap,
      previousMap: spatialMapRuntimeRef.current,
    });
  }, [spatialIdentityKey]);
  useEffect(() => {
    spatialMapRuntimeRef.current = resolvedSpatialMap;
  }, [resolvedSpatialMap]);
  const topologyVisualState = useMemo(() => {
    return mapNeuralCoreTopologyToVisualState({
      topology: spatialTopology,
      graph,
      config: semanticVisualizationConfig.topology,
      spatialMap: resolvedSpatialMap,
    });
  }, [graph, resolvedSpatialMap, semanticVisualizationConfig.topology, spatialTopology]);
  const clusterGrammar = useMemo(() => {
    return mapNeuralCoreClusterGrammar({
      config: clusterGrammarConfig,
      graph,
      topology: spatialTopology,
      topologyVisualState,
    });
  }, [clusterGrammarConfig, graph, spatialTopology, topologyVisualState]);
  const operationalFallbackRoutes = useMemo(() => {
    return clusterGrammar.enabled
      ? EMPTY_NEURAL_CORE_AGGREGATED_ROUTES
      : mapNeuralCoreAggregatedRoutes(spatialTopology, topologyVisualState);
  }, [clusterGrammar.enabled, spatialTopology, topologyVisualState]);
  const operationalFallbackRouteIndexBySynapseId = useMemo(() => {
    return operationalFallbackRoutes.length > 0
      ? createOperationalRouteIndexBySynapseId(operationalFallbackRoutes)
      : EMPTY_NEURAL_CORE_ROUTE_INDEX_BY_SYNAPSE_ID;
  }, [operationalFallbackRoutes]);
  const operationalAggregatedRoutes = clusterGrammar.enabled
    ? clusterGrammar.routes
    : operationalFallbackRoutes;
  const operationalRouteIndexBySynapseId = clusterGrammar.enabled
    ? clusterGrammar.lookups.routeIndexBySynapseId
    : operationalFallbackRouteIndexBySynapseId;
  const operationalRouteVisualChannel = useMemo(() => {
    if (!operationalPropagationInput) {
      return undefined;
    }
    return mapOperationalRouteEventToVisualChannel({
      request: operationalPropagationInput,
      aggregatedRoutes: operationalAggregatedRoutes,
      routeIndexBySynapseId: operationalRouteIndexBySynapseId,
      visualMode: "aggregated",
    });
  }, [
    operationalAggregatedRoutes,
    operationalPropagationInput,
    operationalRouteIndexBySynapseId,
  ]);
  const resolvedOperationalPropagationInput = useMemo(() => (
    operationalPropagationInput && operationalRouteVisualChannel
      ? mapOperationalVisualChannelToPropagation({
        channel: operationalRouteVisualChannel,
        request: operationalPropagationInput,
      })
      : undefined
  ), [operationalPropagationInput, operationalRouteVisualChannel]);
  const operationalTransmissionId = resolvedOperationalPropagationInput?.transmission.id;
  const operationalTransmissionActive = operationalRouteVisualChannel !== undefined
    && operationalTransmissionId !== undefined;
  const propagation = useNeuralCorePropagation({
    topology,
    config: propagationConfig,
    externalTransmission: resolvedOperationalPropagationInput?.transmission,
    externalProgressRef: operationalRouteProgressRef,
    onPropagationEvent,
    resetKey: runtimeScenarioKey,
  });
  const choreographyRuntime = useNeuralCoreChoreography({
    choreography,
    config: semanticVisualizationConfig,
    resetKey: runtimeScenarioKey,
  });
  const clusterGrammarRuntime = useMemo(() => {
    return createNeuralCoreClusterGrammarRuntime(clusterGrammar, clusterGrammarConfig);
  }, [clusterGrammar, clusterGrammarConfig]);
  const clusterTerritoryRefs = useMemo(() => {
    return clusterGrammar.territories.map(() => createRef<Group>());
  }, [clusterGrammar.territories]);
  useEffect(() => {
    clusterGrammar.territories.forEach((territory, index): void => {
      const group = clusterTerritoryRefs[index]?.current;
      if (!group) {
        return;
      }
      const status = operationalVisualOverlay?.clusterStateById[territory.clusterId]?.status;
      const color = status && status !== "idle"
        ? NEURAL_CORE_TOPOLOGY_STATUS_COLORS[status]
        : territory.color;
      const boundary = group.children[0] as Mesh | Points | undefined;
      const boundaryMaterial = boundary?.material as ShaderMaterial | undefined;
      const boundaryColor = boundaryMaterial?.uniforms.uColor?.value;
      if (boundaryColor instanceof Color) {
        boundaryColor.set(color);
      }
      const boundarySemanticColor = boundaryMaterial?.userData.semanticColor;
      if (boundarySemanticColor instanceof Color) {
        boundarySemanticColor.set(color);
      }
      const hub = group.children[1] as Group | undefined;
      for (const child of hub?.children ?? []) {
        const material = (child as Mesh).material as MeshBasicMaterial | undefined;
        material?.color?.set(color);
        const semanticColor = material?.userData.semanticColor;
        if (semanticColor instanceof Color) {
          semanticColor.set(color);
        }
      }
    });
  }, [clusterGrammar.territories, clusterTerritoryRefs, operationalVisualOverlay]);
  const networkFogDepth = useMemo(() => {
    let maximumDepth = 1.8;
    for (const region of topologyVisualState.clusterRegions) {
      maximumDepth = Math.max(
        maximumDepth,
        Math.hypot(region.center[0], region.center[1], region.center[2]) + region.radius,
      );
    }
    return maximumDepth;
  }, [topologyVisualState.clusterRegions]);
  const inspectionDirectionState = useMemo(() => {
    return mapNeuralCoreInspectionDirectionState({
      focus: inspectionFocus,
      topologyVisualState,
      dimUnrelatedContext: inspectionConfig.behavior.dimUnrelatedContext,
      highlightRelatedConnections: inspectionConfig.behavior.highlightRelatedConnections,
    });
  }, [
    inspectionConfig.behavior.dimUnrelatedContext,
    inspectionConfig.behavior.highlightRelatedConnections,
    inspectionFocus,
    topologyVisualState,
  ]);
  const inspectionVisibility = useMemo(() => {
    return mapNeuralCoreInspectionVisibilityState({
      inspectionMode: inspectionState.mode === "inspection",
      selectedClusterId: inspectionFocus.selectedClusterId,
      relatedClusterIds: inspectionFocus.relatedClusterIds,
      relatedSynapseIds: inspectionFocus.relatedSynapseIds,
      relatedPathwayIds: inspectionFocus.relatedPathwayIds,
      cameraDistance: inspectionConfig.camera.maximumDistance,
      isContextPanelOpen: inspectionState.mode === "inspection"
        && inspectionConfig.panel.enabled
        && inspectionFocus.selectedClusterId !== undefined,
      config: inspectionConfig.visualDensity,
    });
  }, [
    inspectionConfig.camera.maximumDistance,
    inspectionConfig.panel.enabled,
    inspectionConfig.visualDensity,
    inspectionFocus,
    inspectionState.mode,
  ]);
  const clusterLabels = useNeuralCoreClusterLabels({
    config: clusterLabelConfig,
    lodConfig,
    runtimeScenarioKey,
    spatialMap: resolvedSpatialMap,
    topology: spatialTopology,
    topologyVisualState,
    operationalOverlay: operationalVisualOverlay,
  });
  const directionRuntime = useNeuralCoreSceneDirection({
    timeline: sceneDirection,
    topologyVisualState,
    config: sceneDirectionConfig,
    resetKey: runtimeScenarioKey,
  });
  const narrativeRuntime = useNeuralCoreNarrative({
    narrative,
    resetKey: runtimeScenarioKey,
  });
  const bufferDimensionsKey = createNeuralCorePropagationBufferDimensionsKey(
    propagation.config,
  );
  const propagationBuffers = useMemo(() => {
    return createNeuralCorePropagationBufferState(
      graph,
      topologyVisualState,
      propagation.config,
    );
  }, [bufferDimensionsKey, graph, topologyVisualState]);
  useEffect(() => {
    const field = propagationBuffers.operationalProtagonistMarkerField;
    field.positions.fill(0);
    field.tangents.fill(0);
    field.colors.fill(0);
    field.opacities.fill(0);
    field.sizes.fill(0);
    const endpointReaction = propagationBuffers.operationalEndpointReactionState;
    endpointReaction.sourceClusterId = undefined;
    endpointReaction.sourceWeight = 0;
    endpointReaction.targetClusterId = undefined;
    endpointReaction.targetWeight = 0;
    endpointReaction.red = 0;
    endpointReaction.green = 0;
    endpointReaction.blue = 0;
    operationalProtagonistMarkerGeometryRef.current?.setDrawRange(0, 0);
    markAttributeForUpdate(operationalProtagonistMarkerPositionRef.current);
    markAttributeForUpdate(operationalProtagonistMarkerTangentRef.current);
    markAttributeForUpdate(operationalProtagonistMarkerColorRef.current);
    markAttributeForUpdate(operationalProtagonistMarkerOpacityRef.current);
    markAttributeForUpdate(operationalProtagonistMarkerSizeRef.current);
    return (): void => {
      field.positions.fill(0);
      field.tangents.fill(0);
      field.colors.fill(0);
      field.opacities.fill(0);
      field.sizes.fill(0);
      endpointReaction.sourceClusterId = undefined;
      endpointReaction.sourceWeight = 0;
      endpointReaction.targetClusterId = undefined;
      endpointReaction.targetWeight = 0;
      endpointReaction.red = 0;
      endpointReaction.green = 0;
      endpointReaction.blue = 0;
      operationalProtagonistMarkerGeometryRef.current?.setDrawRange(0, 0);
    };
  }, [operationalTransmissionId, propagationBuffers, runtimeScenarioKey]);
  useEffect(() => {
    aggregatedPulseSuppressionRef.current = 1;
    operationalRouteOpacityMultiplierRef.current = 1;
    operationalRouteThicknessMultiplierRef.current = 1;
    operationalRouteRenderIndexRef.current = undefined;
    const opacityUniform = ambientPulseMaterialRef.current?.uniforms.uOpacity;
    if (opacityUniform) {
      opacityUniform.value = graph.pulseField.opacity;
    }
  }, [clusterGrammar, graph.pulseField.opacity, runtimeScenarioKey]);
  useEffect(() => {
    return (): void => {
      aggregatedPulseSuppressionRef.current = 1;
      operationalRouteOpacityMultiplierRef.current = 1;
      operationalRouteThicknessMultiplierRef.current = 1;
      operationalRouteRenderIndexRef.current = undefined;
      const opacityUniform = ambientPulseMaterialRef.current?.uniforms.uOpacity;
      if (opacityUniform) {
        opacityUniform.value = graph.pulseField.opacity;
      }
      operationalProtagonistMarkerGeometryRef.current?.setDrawRange(0, 0);
    };
  }, [graph.pulseField.opacity]);
  const semanticBufferDimensionsKey = createNeuralCoreSemanticBufferDimensionsKey(
    semanticVisualizationConfig,
  );
  const semanticVisualRuntime = useMemo(() => {
    return propagation.plan
      ? createNeuralCoreSemanticVisualRuntime(
        propagation.plan.topology,
        topologyVisualState,
        semanticVisualizationConfig,
      )
      : undefined;
  }, [propagation.plan, semanticVisualizationConfig, topologyVisualState]);
  const semanticBuffers = useMemo(() => {
    return createNeuralCoreSemanticBufferState(
      graph,
      topologyVisualState,
      semanticVisualizationConfig,
      propagation.plan?.topology,
      semanticBufferStateRef.current,
    );
  }, [graph, propagation.plan, semanticBufferDimensionsKey, topologyVisualState]);
  const clusterGrammarBuffers = useMemo(() => {
    return createNeuralCoreClusterGrammarBufferState(
      graph,
      semanticBuffers,
      clusterGrammar,
      clusterGrammarConfig,
    );
  }, [clusterGrammar, clusterGrammarConfig, graph, semanticBuffers]);
  const clusterGrammarNodeOpacityRefs = useMemo(() => {
    return graph.nodeClouds.map(() => createRef<BufferAttribute>());
  }, [graph.nodeClouds]);
  const clusterGrammarConnectionOpacityRefs = useMemo(() => {
    return graph.connectionBuffers.map(() => createRef<BufferAttribute>());
  }, [graph.connectionBuffers]);
  const aggregatedRouteField = useMemo(() => {
    return createNeuralCoreAggregatedRouteRenderField(clusterGrammar);
  }, [clusterGrammar]);
  const aggregatedPulseField = useMemo(() => {
    return createNeuralCoreAggregatedPulseField(clusterGrammar);
  }, [clusterGrammar]);
  const aggregatedOperationalRouteColors = useMemo(() => (
    clusterGrammar.routes.map((route) => new Color(route.color))
  ), [clusterGrammar.routes]);
  useEffect(() => {
    for (let routeIndex = 0; routeIndex < clusterGrammar.routes.length; routeIndex += 1) {
      const route = clusterGrammar.routes[routeIndex];
      let status = route.status;
      for (const synapseId of route.synapseIds) {
        const operationalStatus = operationalVisualOverlay?.routeStatusById[synapseId];
        if (operationalStatus !== undefined) {
          status = operationalStatus;
          break;
        }
      }
      if (route.id === operationalRouteVisualChannel?.geometryId) {
        status = operationalRouteVisualChannel.status === "recovering"
          ? "warning"
          : operationalRouteVisualChannel.status;
      }
      const color = aggregatedOperationalRouteColors[routeIndex];
      color.set(status && status !== "idle"
        ? NEURAL_CORE_TOPOLOGY_STATUS_COLORS[status]
        : route.color);
      const routeColorOffset = routeIndex * 3;
      aggregatedPulseField.routeColors[routeColorOffset] = color.r;
      aggregatedPulseField.routeColors[routeColorOffset + 1] = color.g;
      aggregatedPulseField.routeColors[routeColorOffset + 2] = color.b;
    }
    for (
      let vertexIndex = 0;
      vertexIndex < aggregatedRouteField.routeIndices.length;
      vertexIndex += 1
    ) {
      const color = aggregatedOperationalRouteColors[
        aggregatedRouteField.routeIndices[vertexIndex]
      ];
      const colorOffset = vertexIndex * 3;
      aggregatedRouteField.colors[colorOffset] = color.r;
      aggregatedRouteField.colors[colorOffset + 1] = color.g;
      aggregatedRouteField.colors[colorOffset + 2] = color.b;
    }
    markAttributeForUpdate(aggregatedRouteColorRef.current);
  }, [
    aggregatedOperationalRouteColors,
    aggregatedPulseField,
    aggregatedRouteField,
    clusterGrammar.routes,
    operationalRouteVisualChannel,
    operationalVisualOverlay,
  ]);
  useEffect(() => {
    semanticBufferStateRef.current = semanticBuffers;
  }, [semanticBuffers]);
  useEffect(() => {
    inspectionRootRef.current = gl.domElement.closest<HTMLElement>(
      "[data-neural-core-inspection-root]",
    );
  }, [gl]);

  const beginCameraTransition = useCallback((
    kind: NeuralCoreCameraTransitionKind,
    endTarget: Vector3,
    endPosition: Vector3,
  ): void => {
    const transition = cameraTransitionRef.current;
    const controls = orbitControlsRef.current;
    transition.active = true;
    transition.elapsedSeconds = 0;
    transition.durationSeconds = inspectionConfig.camera.focusTransitionSeconds;
    transition.kind = kind;
    transition.startPosition.copy(sceneCamera.position);
    transition.startTarget.copy(controls?.target ?? inspectionWorldCenterRef.current);
    transition.endTarget.copy(endTarget);
    transition.endPosition.copy(endPosition);
    onCameraTransitioningChange(true);
  }, [
    inspectionConfig.camera.focusTransitionSeconds,
    onCameraTransitioningChange,
    sceneCamera,
  ]);

  const cancelCameraTransition = useCallback((): void => {
    if (!cameraTransitionRef.current.active) {
      return;
    }
    cameraTransitionRef.current.active = false;
    onCameraTransitioningChange(false);
  }, [onCameraTransitioningChange]);

  const previousInteractionModeRef = useRef(inspectionState.mode);
  useEffect(() => {
    const previousMode = previousInteractionModeRef.current;
    previousInteractionModeRef.current = inspectionState.mode;
    if (previousMode === inspectionState.mode) {
      return;
    }
    const controls = orbitControlsRef.current;
    if (inspectionState.mode === "inspection") {
      cameraTransitionRef.current.active = false;
      inspectionWorldCenterRef.current.set(
        cameraWorldTargetRef.current[0],
        cameraWorldTargetRef.current[1],
        cameraWorldTargetRef.current[2],
      );
      controls?.target.copy(inspectionWorldCenterRef.current);
      controls?.update();
      onCameraTransitioningChange(false);
      return;
    }
    inspectionWorldCenterRef.current.set(
      cameraWorldTargetRef.current[0],
      cameraWorldTargetRef.current[1],
      cameraWorldTargetRef.current[2],
    );
    inspectionViewDirectionRef.current.copy(sceneCamera.position);
    beginCameraTransition(
      "presentation",
      inspectionWorldCenterRef.current,
      inspectionViewDirectionRef.current,
    );
  }, [
    beginCameraTransition,
    inspectionState.mode,
    onCameraTransitioningChange,
    sceneCamera,
  ]);

  useEffect(() => {
    if (
      inspectionState.mode !== "inspection"
      || !inspectionConfig.behavior.focusSelectedCluster
      || !inspectionFocus.selectedClusterId
    ) {
      return;
    }
    const region = topologyVisualState.lookups.clusterRegionById[
      inspectionFocus.selectedClusterId
    ];
    const network = networkRef.current;
    if (!region || !network) {
      return;
    }
    network.updateWorldMatrix(true, false);
    const focusCenter = inspectionWorldCenterRef.current;
    focusCenter.set(region.center[0], region.center[1], region.center[2]);
    focusCenter.applyMatrix4(network.matrixWorld);
    const controlsTarget = orbitControlsRef.current?.target ?? focusCenter;
    const viewDirection = inspectionViewDirectionRef.current;
    viewDirection.subVectors(sceneCamera.position, controlsTarget);
    if (viewDirection.lengthSq() <= 0.000001) {
      viewDirection.set(0, 0, 1);
    } else {
      viewDirection.normalize();
    }
    const transition = cameraTransitionRef.current;
    transition.endPosition.copy(focusCenter).addScaledVector(
      viewDirection,
      inspectionConfig.camera.focusDistance,
    );
    beginCameraTransition("focus", focusCenter, transition.endPosition);
  }, [
    beginCameraTransition,
    inspectionConfig.behavior.focusSelectedCluster,
    inspectionConfig.camera.focusDistance,
    inspectionFocus.selectedClusterId,
    inspectionState.mode,
    sceneCamera,
    topologyVisualState,
  ]);

  const previousCameraResetRevisionRef = useRef(cameraResetRevision);
  useEffect(() => {
    if (previousCameraResetRevisionRef.current === cameraResetRevision) {
      return;
    }
    previousCameraResetRevisionRef.current = cameraResetRevision;
    if (inspectionState.mode !== "inspection") {
      return;
    }
    const network = networkRef.current;
    const center = inspectionWorldCenterRef.current;
    if (network) {
      network.updateWorldMatrix(true, false);
      network.getWorldPosition(center);
    } else {
      center.set(0, 0, 0);
    }
    const transition = cameraTransitionRef.current;
    transition.endPosition.set(
      center.x,
      center.y,
      center.z + Math.min(
        inspectionConfig.camera.maximumDistance,
        Math.max(inspectionConfig.camera.minimumDistance, 4.35),
      ),
    );
    beginCameraTransition("overview", center, transition.endPosition);
  }, [
    beginCameraTransition,
    cameraResetRevision,
    inspectionConfig.camera.maximumDistance,
    inspectionConfig.camera.minimumDistance,
    inspectionState.mode,
  ]);

  useEffect(() => {
    const canvas = gl.domElement;
    const pointerRuntime = pointerRuntimeRef.current;
    const handlePointerDown = (event: PointerEvent): void => {
      if (inspectionState.mode !== "inspection" || event.button !== 0) {
        return;
      }
      pointerRuntime.clientX = event.clientX;
      pointerRuntime.clientY = event.clientY;
      pointerRuntime.pointerId = event.pointerId;
    };
    const handlePointerUp = (event: PointerEvent): void => {
      if (
        inspectionState.mode !== "inspection"
        || event.button !== 0
        || pointerRuntime.pointerId !== event.pointerId
      ) {
        return;
      }
      pointerRuntime.pointerId = -1;
      if (Math.hypot(
        event.clientX - pointerRuntime.clientX,
        event.clientY - pointerRuntime.clientY,
      ) > 5) {
        return;
      }
      const network = networkRef.current;
      if (!network) {
        return;
      }
      const bounds = canvas.getBoundingClientRect();
      const pointer = pickingPointerRef.current;
      pointer.set(
        (event.clientX - bounds.left) / bounds.width * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      const raycaster = pickingRaycasterRef.current;
      raycaster.setFromCamera(pointer, sceneCamera);
      network.updateWorldMatrix(true, false);
      network.getWorldScale(pickingScaleRef.current);
      const worldScale = Math.max(
        Math.abs(pickingScaleRef.current.x),
        Math.abs(pickingScaleRef.current.y),
        Math.abs(pickingScaleRef.current.z),
      );
      let bestCandidate: NeuralCoreInspectionPickCandidate | undefined;
      for (const region of topologyVisualState.clusterRegions) {
        const center = pickingCenterRef.current;
        center.set(region.center[0], region.center[1], region.center[2]);
        center.applyMatrix4(network.matrixWorld);
        const sphere = pickingSphereRef.current;
        sphere.center.copy(center);
        sphere.radius = region.radius * worldScale;
        if (!raycaster.ray.intersectSphere(sphere, pickingHitRef.current)) {
          continue;
        }
        const cluster = spatialTopology.clusters.find(
          (candidate) => candidate.id === region.clusterId,
        );
        const candidate: NeuralCoreInspectionPickCandidate = {
          clusterId: region.clusterId,
          distanceToCamera: sceneCamera.position.distanceTo(center),
          distanceToRay: Math.sqrt(raycaster.ray.distanceSqToPoint(center))
            / Math.max(0.0001, sphere.radius),
          priority: cluster?.positionHint?.priority ?? cluster?.importance ?? 0,
        };
        if (isNeuralCoreInspectionPickCandidateBetter(candidate, bestCandidate)) {
          bestCandidate = candidate;
        }
      }
      if (bestCandidate) {
        onSelectCluster(bestCandidate.clusterId);
      }
    };
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);
    return (): void => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    gl,
    inspectionState.mode,
    onSelectCluster,
    sceneCamera,
    spatialTopology.clusters,
    topologyVisualState.clusterRegions,
  ]);

  useFrame(({ camera, clock, size, viewport }, deltaSeconds): void => {
    const safeDeltaSeconds = Number.isFinite(deltaSeconds)
      ? Math.max(0, Math.min(0.1, deltaSeconds))
      : 0;
    const simulationDeltaSeconds = resolveNeuralCoreSimulationDelta(
      safeDeltaSeconds,
      inspectionState.isPaused,
    );
    const runtimeDeltaSeconds = runtimePlaybackStatus === undefined
      || (!runtimePlaybackPaused && (
        runtimePlaybackStatus === "running"
        || runtimePlaybackStatus === "failed"
        || runtimePlaybackStatus === "recovering"
      ))
      ? simulationDeltaSeconds
      : 0;
    simulationElapsedSecondsRef.current += simulationDeltaSeconds;
    const elapsedTime = simulationElapsedSecondsRef.current;
    runtimeVisualElapsedSecondsRef.current += runtimeDeltaSeconds;
    const propagationElapsedTime = runtimePlaybackStatus === undefined
      ? elapsedTime
      : runtimeVisualElapsedSecondsRef.current;
    const propagationVisualState = propagation.advance(runtimeDeltaSeconds);
    const choreographyEvaluation = choreographyRuntime.advance(simulationDeltaSeconds);
    const directionState = directionRuntime.advance(
      inspectionState.mode === "presentation" ? runtimeDeltaSeconds : 0,
    );
    const effectiveDirectionState = inspectionState.mode === "inspection"
      && inspectionFocus.selectedClusterId !== undefined
      ? inspectionDirectionState
      : directionState;
    const narrativeState = narrativeRuntime.advance(
      runtimeDeltaSeconds,
      choreography ? choreographyEvaluation.timelineSeconds : undefined,
    );
    const narrativeVisualState = mapNeuralCoreNarrativeToVisualState(narrativeState);
    const cameraDistanceTargetWorld = cameraDistanceTargetWorldRef.current;
    const networkForDensity = networkRef.current;
    if (networkForDensity) {
      networkForDensity.updateWorldMatrix(true, false);
      const selectedDensityRegion = inspectionFocus.selectedClusterId
        ? topologyVisualState.lookups.clusterRegionById[inspectionFocus.selectedClusterId]
        : undefined;
      if (selectedDensityRegion) {
        cameraDistanceTargetWorld.set(
          selectedDensityRegion.center[0],
          selectedDensityRegion.center[1],
          selectedDensityRegion.center[2],
        );
        cameraDistanceTargetWorld.applyMatrix4(networkForDensity.matrixWorld);
      } else if (orbitControlsRef.current) {
        cameraDistanceTargetWorld.copy(orbitControlsRef.current.target);
      } else {
        networkForDensity.getWorldPosition(cameraDistanceTargetWorld);
      }
    } else {
      cameraDistanceTargetWorld.set(0, 0, 0);
    }
    const relevantCameraDistance = camera.position.distanceTo(cameraDistanceTargetWorld);
    const visualDensity = updateNeuralCoreVisualDensityRuntime(
      visualDensityRuntimeRef.current,
      inspectionConfig.visualDensity,
      relevantCameraDistance,
      safeDeltaSeconds,
      inspectionState.mode,
    );
    const cameraProfile = updateNeuralCoreCameraRenderingProfile(
      cameraRenderingProfileRef.current,
      relevantCameraDistance,
      inspectionConfig.camera.minimumDistance,
      inspectionConfig.camera.maximumDistance,
      inspectionConfig.cameraRendering,
      inspectionState.mode === "inspection",
    );
    updateNeuralCoreInspectionVisibilityState(
      inspectionVisibility,
      inspectionConfig.visualDensity,
      inspectionState.mode,
      inspectionState.mode === "inspection"
        && inspectionConfig.panel.enabled
        && inspectionFocus.selectedClusterId !== undefined,
      visualDensity.macroWeight,
      visualDensity.mesoWeight,
      visualDensity.microWeight,
    );
    const networkMatrix = networkForDensity?.matrixWorld.elements;
    const cameraDistanceToBrain = networkMatrix
      ? Math.hypot(
        camera.position.x - networkMatrix[12],
        camera.position.y - networkMatrix[13],
        camera.position.z - networkMatrix[14],
      )
      : relevantCameraDistance;
    const grammarDensity = clusterGrammarDensityRef.current;
    grammarDensity.macroWeight = visualDensity.macroWeight;
    grammarDensity.mesoWeight = visualDensity.mesoWeight;
    grammarDensity.microWeight = visualDensity.microWeight;
    const focusLensParams = focusLensParamsRef.current;
    focusLensParams.interactionMode = inspectionState.mode;
    focusLensParams.selectedClusterId = inspectionFocus.selectedClusterId;
    focusLensParams.runtimeFocusedClusterId = runtimeFocusedClusterId;
    focusLensParams.cameraDistanceToSelected = inspectionFocus.selectedClusterId
      ? relevantCameraDistance
      : undefined;
    focusLensParams.cameraDistanceToBrain = cameraDistanceToBrain;
    writeNeuralCoreSemanticFocusLensTarget(
      focusLensTarget,
      focusLensParams,
      semanticFocusLensConfig,
    );
    updateNeuralCoreSemanticFocusLensRuntime(
      focusLensRuntime,
      focusLensTarget,
      semanticFocusLensConfig,
      safeDeltaSeconds,
    );
    aggregatedPulseSuppressionRef.current = dampNeuralCoreSceneDirectionValue(
      aggregatedPulseSuppressionRef.current,
      operationalTransmissionActive
        ? NEURAL_CORE_OPERATIONAL_PROTAGONIST_MARKER_CONFIG
          .backgroundAggregatedPulseMultiplier
        : 1,
      operationalTransmissionActive
        ? semanticVisualizationConfig.transition.activationResponse
        : semanticVisualizationConfig.transition.releaseResponse,
      safeDeltaSeconds,
    );
    const activeOperationalRouteIndex = operationalTransmissionActive
      && operationalRouteVisualChannel
      ? clusterGrammar.lookups.routeIndexById[
        operationalRouteVisualChannel.geometryId
      ]
      : undefined;
    if (activeOperationalRouteIndex !== undefined) {
      operationalRouteRenderIndexRef.current = activeOperationalRouteIndex;
    }
    operationalRouteOpacityMultiplierRef.current =
      dampNeuralCoreSceneDirectionValue(
        operationalRouteOpacityMultiplierRef.current,
        operationalTransmissionActive
          ? NEURAL_CORE_OPERATIONAL_PROTAGONIST_MARKER_CONFIG
            .activeRouteOpacityMultiplier
          : 1,
        operationalTransmissionActive
          ? semanticVisualizationConfig.transition.activationResponse
          : semanticVisualizationConfig.transition.releaseResponse,
        safeDeltaSeconds,
      );
    operationalRouteThicknessMultiplierRef.current =
      dampNeuralCoreSceneDirectionValue(
        operationalRouteThicknessMultiplierRef.current,
        operationalTransmissionActive
          ? NEURAL_CORE_OPERATIONAL_PROTAGONIST_MARKER_CONFIG
            .activeRouteThicknessMultiplier
          : 1,
        operationalTransmissionActive
          ? semanticVisualizationConfig.transition.activationResponse
          : semanticVisualizationConfig.transition.releaseResponse,
        safeDeltaSeconds,
      );
    if (
      !operationalTransmissionActive
      && operationalRouteOpacityMultiplierRef.current >= 0.999
      && operationalRouteThicknessMultiplierRef.current >= 0.999
    ) {
      operationalRouteRenderIndexRef.current = undefined;
    }
    const markerViewportUniform = operationalProtagonistMarkerMaterialRef.current
      ?.uniforms.uViewport?.value;
    if (markerViewportUniform instanceof Vector2) {
      markerViewportUniform.set(
        size.width * viewport.dpr,
        size.height * viewport.dpr,
      );
    }
    if (clusterGrammar.enabled) {
      const grammarFocus = clusterGrammarFocusRef.current;
      grammarFocus.selectedClusterId = focusLensRuntime.enabled
        ? focusLensRuntime.selectedClusterId
        : inspectionFocus.selectedClusterId;
      grammarFocus.relatedClusterIds = focusLensRuntime.enabled
        && focusLensRuntime.selectedClusterId === undefined
        ? EMPTY_NEURAL_CORE_CLUSTER_IDS
        : inspectionFocus.relatedClusterIds;
      grammarFocus.narrativeClusterIds = narrativeState.clusterIds;
      grammarFocus.narrativeSynapseIds = narrativeState.synapseIds;
      grammarFocus.narrativePathwayIds = narrativeState.pathwayIds;
      grammarFocus.protagonistClusterId = narrativeState.clusterIds[0]
        ?? (
          effectiveDirectionState.focusTargetType === "cluster"
            ? effectiveDirectionState.focusTargetId
            : undefined
        );
      updateNeuralCoreClusterGrammarRuntime(
        clusterGrammarRuntime,
        clusterGrammar,
        clusterGrammarConfig,
        grammarFocus,
        grammarDensity,
        propagationVisualState,
        focusLensRuntime,
        semanticFocusLensConfig,
        safeDeltaSeconds,
        operationalVisualOverlay,
        operationalRouteVisualChannel,
      );
      updateNeuralCoreClusterGrammarBuffers(
        clusterGrammarBuffers,
        graph,
        clusterGrammarRuntime,
        grammarDensity,
        focusLensRuntime,
        semanticFocusLensConfig,
      );
      updateNeuralCoreAggregatedRouteRenderField(
        aggregatedRouteField,
        clusterGrammarRuntime,
        operationalRouteRenderIndexRef.current,
        operationalRouteOpacityMultiplierRef.current,
        operationalRouteThicknessMultiplierRef.current,
      );
      const aggregatedPulsePointCount = updateNeuralCoreAggregatedPulseField(
        aggregatedPulseField,
        clusterGrammar,
        clusterGrammarRuntime,
        propagationElapsedTime,
        operationalTransmissionActive
          ? operationalRouteVisualChannel?.geometryId
          : undefined,
        aggregatedPulseSuppressionRef.current,
      );
      aggregatedPulseGeometryRef.current?.setDrawRange(0, aggregatedPulsePointCount);
      markAttributeForUpdate(aggregatedRouteOpacityRef.current);
      markAttributeForUpdate(aggregatedRouteThicknessRef.current);
      markAttributeForUpdate(aggregatedPulsePositionRef.current);
      markAttributeForUpdate(aggregatedPulseColorRef.current);
      markAttributeForUpdate(aggregatedPulseOpacityRef.current);
      markAttributeForUpdate(aggregatedPulseSizeRef.current);
      for (const attributeRef of clusterGrammarNodeOpacityRefs) {
        markAttributeForUpdate(attributeRef.current);
      }
      for (const attributeRef of clusterGrammarConnectionOpacityRefs) {
        markAttributeForUpdate(attributeRef.current);
      }
      markAttributeForUpdate(clusterGrammarRibbonOpacityRef.current);
    }
    const inspectionRoot = inspectionRootRef.current;
    if (inspectionRoot) {
      const cssValues = inspectionCssValuesRef.current;
      const nextMicroFocus = (
        inspectionVisibility.hasSelection ? inspectionVisibility.microWeight : 0
      ).toFixed(3);
      const decorativeComposition = writeNeuralCoreElementVisualComposition(
        SCENE_VISUAL_COMPOSITION,
        "decorative",
        "decorative",
        1,
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
      const directionContextAmount = sceneDirectionConfig.focus.maximumContextDim > 0
        ? Math.min(
          1,
          Math.max(
            0,
            effectiveDirectionState.contextDim
              / sceneDirectionConfig.focus.maximumContextDim,
          ),
        )
        : 0;
      const directionFocusAmount = effectiveDirectionState.isOverview
        ? 0
        : Math.max(directionContextAmount, effectiveDirectionState.transitionProgress);
      const narrativeFocusAmount = narrativeState.isActive
        ? Math.max(0.48, Math.min(1, narrativeState.contextDim))
        : 0;
      const inspectionFocusAmount = inspectionVisibility.hasSelection
        ? 0.68 + inspectionVisibility.microWeight * 0.32
        : 0;
      const neuralFocusAmount = Math.max(
        directionFocusAmount,
        narrativeFocusAmount,
        inspectionFocusAmount,
      );
      const baseVisibility = Math.max(
        0.42,
        Math.min(
          decorativeComposition.opacity,
          inspectionVisibility.enabled ? inspectionVisibility.baseWeight : 1,
          1 - neuralFocusAmount * 0.28,
        ),
      );
      const globalGlowVisibility = Math.max(
        0.38,
        Math.min(
          decorativeComposition.opacity,
          inspectionVisibility.enabled ? inspectionVisibility.globalGlowWeight : 1,
          1 - neuralFocusAmount * 0.58,
        ),
      );
      const nextBase = baseVisibility.toFixed(3);
      const nextGlobalGlow = globalGlowVisibility.toFixed(3);
      if (cssValues.microFocus !== nextMicroFocus) {
        cssValues.microFocus = nextMicroFocus;
        inspectionRoot.style.setProperty("--neural-core-micro-focus", nextMicroFocus);
      }
      if (cssValues.base !== nextBase) {
        cssValues.base = nextBase;
        inspectionRoot.style.setProperty("--neural-core-base-visibility", nextBase);
      }
      if (cssValues.globalGlow !== nextGlobalGlow) {
        cssValues.globalGlow = nextGlobalGlow;
        inspectionRoot.style.setProperty(
          "--neural-core-global-glow-visibility",
          nextGlobalGlow,
        );
      }
    }
    const narrativePhaseKey = `${narrativeState.narrativeId ?? "none"}:${
      narrativeState.activePhaseId ?? "idle"
    }:${narrativeState.isActive ? "active" : "inactive"}`;
    if (narrativePhaseKeyRef.current !== narrativePhaseKey) {
      narrativePhaseKeyRef.current = narrativePhaseKey;
      onNarrativeStateChange(narrativeState);
    }
    const choreographyLoopRuntime = choreographyLoopRuntimeRef.current;
    const choreographyLoops = choreography?.loop
      ?? semanticVisualizationConfig.choreography.loopDemoChoreographies;
    if (
      choreographyLoops
      && choreographyLoopRuntime.choreographyId === choreographyEvaluation.choreographyId
      && choreographyEvaluation.timelineSeconds + 0.0001
        < choreographyLoopRuntime.timelineSeconds
    ) {
      propagation.reset();
    }
    choreographyLoopRuntime.choreographyId = choreographyEvaluation.choreographyId;
    choreographyLoopRuntime.timelineSeconds = choreographyEvaluation.timelineSeconds;
    const semanticVisualState = semanticVisualRuntime
      ? updateNeuralCoreSemanticVisualRuntime(
        semanticVisualRuntime,
        propagationVisualState,
        choreographyEvaluation,
        semanticVisualizationConfig,
        operationalVisualOverlay,
      )
      : EMPTY_NEURAL_CORE_SEMANTIC_VISUAL_STATE;

    const {
      clusterPointCount,
      operationalProtagonistMarkerCount,
      pulsePointCount,
    } = updateNeuralCorePropagationBuffers(
      propagationBuffers,
      propagationVisualState,
      topologyVisualState,
      propagation.config.pulse.trailSampleCount,
      effectiveDirectionState,
      sceneDirectionConfig,
      propagation.config,
      cameraProfile,
      inspectionVisibility,
      operationalRouteVisualChannel,
      operationalTransmissionId,
    );
    if (clusterGrammar.enabled) {
      updateClusterTerritoryVisuals(
        clusterTerritoryRefs,
        clusterGrammarRuntime.clusterStates,
        propagationBuffers.operationalEndpointReactionState,
        propagationElapsedTime,
      );
    }
    if (clusterGrammar.enabled) {
      const detailedPulseWeight = focusLensRuntime.enabled
        ? focusLensRuntime.realActivityWeight
        : inspectionFocus.selectedClusterId
          ? inspectionVisibility.mesoWeight * 0.42 + inspectionVisibility.microWeight
          : 0.035;
      for (let index = 0; index < pulsePointCount; index += 1) {
        propagationBuffers.pulseField.opacities[index] *= detailedPulseWeight;
      }
      if (focusLensRuntime.enabled) {
        for (let index = 0; index < clusterPointCount; index += 1) {
          propagationBuffers.clusterField.opacities[index] *=
            focusLensRuntime.aggregatedActivityWeight;
        }
      }
    }
    propagationPulseGeometryRef.current?.setDrawRange(0, pulsePointCount);
    operationalProtagonistMarkerGeometryRef.current?.setDrawRange(
      0,
      operationalProtagonistMarkerCount,
    );
    clusterActivationGeometryRef.current?.setDrawRange(0, clusterPointCount);
    markAttributeForUpdate(propagationPulsePositionRef.current);
    markAttributeForUpdate(propagationPulseColorRef.current);
    markAttributeForUpdate(propagationPulseOpacityRef.current);
    markAttributeForUpdate(propagationPulseSizeRef.current);
    markAttributeForUpdate(operationalProtagonistMarkerPositionRef.current);
    markAttributeForUpdate(operationalProtagonistMarkerTangentRef.current);
    markAttributeForUpdate(operationalProtagonistMarkerColorRef.current);
    markAttributeForUpdate(operationalProtagonistMarkerOpacityRef.current);
    markAttributeForUpdate(operationalProtagonistMarkerSizeRef.current);
    markAttributeForUpdate(clusterActivationPositionRef.current);
    markAttributeForUpdate(clusterActivationColorRef.current);
    markAttributeForUpdate(clusterActivationOpacityRef.current);
    markAttributeForUpdate(clusterActivationSizeRef.current);

    const semanticUpdate = updateNeuralCoreSemanticBuffers(
      semanticBuffers,
      graph,
      semanticVisualState,
      semanticVisualizationConfig,
      effectiveDirectionState,
      sceneDirectionConfig,
      narrativeVisualState,
      propagation.config.pulse.routeBackgroundOpacity,
      safeDeltaSeconds,
      cameraProfile,
      inspectionVisibility,
    );
    updatePointCloudMaterials(
      nodeCloudRef.current,
      elapsedTime,
      size.height * viewport.dpr * 0.5,
      semanticUpdate.nodeAttributesChanged,
    );
    if (semanticUpdate.connectionAttributesChanged) {
      markConnectionAttributesForUpdate(connectionRef.current);
    }
    if (semanticUpdate.ribbonAttributesChanged) {
      markAttributeForUpdate(semanticRibbonColorRef.current);
      markAttributeForUpdate(semanticRibbonFragmentationRef.current);
      markAttributeForUpdate(semanticRibbonInstabilityRef.current);
      markAttributeForUpdate(semanticRibbonInterruptionRef.current);
      markAttributeForUpdate(semanticRibbonOpacityRef.current);
      markAttributeForUpdate(semanticRibbonPulseFrequencyRef.current);
      markAttributeForUpdate(semanticRibbonPulseIntensityRef.current);
      markAttributeForUpdate(semanticRibbonThicknessRef.current);
    }
    if (semanticRibbonMaterialRef.current) {
      semanticRibbonMaterialRef.current.uniforms.uTime.value = propagationElapsedTime;
      semanticRibbonMaterialRef.current.uniforms.uResolution.value.x = size.width;
      semanticRibbonMaterialRef.current.uniforms.uResolution.value.y = size.height;
      semanticRibbonMaterialRef.current.uniforms.uFocusLensThickness.value =
        clusterGrammar.enabled && focusLensRuntime.enabled
          ? focusLensRuntime.detailedSynapseThickness
          : 1;
    }
    if (nodeCloudRef.current) {
      const maximumNodeScreenSize = inspectionVisibility.enabled
        ? cameraProfile.selectedNodeMaximumScreenSize
        : cameraProfile.nodeMaximumScreenSize;
      for (const child of nodeCloudRef.current.children) {
        const material = (child as Points).material as ShaderMaterial;
        if (material.uniforms.uMinimumScreenSize) {
          material.uniforms.uMinimumScreenSize.value = cameraProfile.nodeMinimumScreenSize;
        }
        if (material.uniforms.uMaximumScreenSize) {
          material.uniforms.uMaximumScreenSize.value = maximumNodeScreenSize;
        }
      }
    }

    const propagationActivity = getPropagationActivity(propagationVisualState);
    const motion = motionRuntimeRef.current;
    motion.smoothedActivity = dampNeuralCoreValue(
      motion.smoothedActivity,
      propagationActivity,
      semanticVisualizationConfig.motion.activityResponse,
      safeDeltaSeconds,
    );
    const rotationActivityInfluence = Math.min(
      semanticVisualizationConfig.motion.maximumRotationActivityInfluence,
      Math.max(0, propagation.config.motion.rotationActivityInfluence),
    );
    const targetRotationMultiplier = 1
      + motion.smoothedActivity * rotationActivityInfluence;
    const targetBreathingMultiplier = 1
      + motion.smoothedActivity * Math.min(
        0.35,
        Math.max(0, propagation.config.motion.breathingActivityInfluence),
      );
    const targetParticleMultiplier = 1
      + motion.smoothedActivity * Math.min(
        0.35,
        Math.max(0, propagation.config.motion.particleActivityInfluence),
      );
    motion.smoothedRotationMultiplier = dampNeuralCoreValue(
      motion.smoothedRotationMultiplier,
      targetRotationMultiplier,
      semanticVisualizationConfig.motion.activityResponse,
      safeDeltaSeconds,
    );
    motion.smoothedBreathingMultiplier = dampNeuralCoreValue(
      motion.smoothedBreathingMultiplier,
      targetBreathingMultiplier,
      semanticVisualizationConfig.motion.activityResponse,
      safeDeltaSeconds,
    );
    motion.smoothedParticleMultiplier = dampNeuralCoreValue(
      motion.smoothedParticleMultiplier,
      targetParticleMultiplier,
      semanticVisualizationConfig.motion.activityResponse,
      safeDeltaSeconds,
    );
    const presentationAutoRotate = inspectionState.mode === "presentation"
      && sceneMotionConfig.autoRotate;
    const targetRotationSpeed = presentationAutoRotate
      ? sceneMotionConfig.baseRotationSpeed
        * motion.smoothedRotationMultiplier
        * effectiveDirectionState.rotationMultiplier
      : 0;
    motion.rotationSpeed = dampNeuralCoreSceneDirectionValue(
      motion.rotationSpeed,
      targetRotationSpeed,
      sceneMotionConfig.rotationTransitionResponse,
      inspectionState.mode === "inspection" ? safeDeltaSeconds : simulationDeltaSeconds,
    );
    if (inspectionState.mode === "presentation") {
      motion.rotationY += motion.rotationSpeed * simulationDeltaSeconds;
    }
    if (inspectionState.mode === "presentation" && !sceneMotionConfig.autoRotate) {
      motion.rotationY = dampNeuralCoreSceneDirectionAngle(
        motion.rotationY,
        sceneMotionConfig.horizontalOrientationY,
        sceneMotionConfig.rotationTransitionResponse,
        simulationDeltaSeconds,
      );
    }
    const secondaryRotationAmount = presentationAutoRotate
      ? effectiveDirectionState.rotationMultiplier
      : 0;
    const targetRotationX = sceneMotionConfig.horizontalOrientationX
      + Math.sin(elapsedTime * 0.14) * 0.044 * secondaryRotationAmount;
    const targetRotationZ = sceneMotionConfig.horizontalOrientationZ
      + Math.cos(elapsedTime * 0.09) * 0.019 * secondaryRotationAmount;
    motion.rotationX = dampNeuralCoreSceneDirectionAngle(
      motion.rotationX,
      targetRotationX,
      sceneMotionConfig.rotationTransitionResponse,
      simulationDeltaSeconds,
    );
    motion.rotationZ = dampNeuralCoreSceneDirectionAngle(
      motion.rotationZ,
      targetRotationZ,
      sceneMotionConfig.rotationTransitionResponse,
      simulationDeltaSeconds,
    );
    motion.particleTime += motion.smoothedParticleMultiplier * simulationDeltaSeconds;

    if (networkRef.current) {
      networkRef.current.rotation.y = motion.rotationY;
      networkRef.current.rotation.x = motion.rotationX;
      networkRef.current.rotation.z = motion.rotationZ;
      networkRef.current.scale.setScalar(
        0.95
          + Math.sin(elapsedTime * 0.31) * 0.004 * motion.smoothedBreathingMultiplier,
      );
    }

    const networkScale = networkRef.current?.scale.x ?? 1;
    if (inspectionState.mode === "presentation") {
      writeRotatedSceneVector(
        directionState.target,
        motion.rotationX,
        motion.rotationY,
        motion.rotationZ,
        networkScale,
        cameraWorldTargetRef.current,
      );
      cameraWorldPositionRef.current[0] = cameraWorldTargetRef.current[0]
        + directionState.cameraPosition[0] - directionState.target[0];
      cameraWorldPositionRef.current[1] = cameraWorldTargetRef.current[1]
        + directionState.cameraPosition[1] - directionState.target[1];
      cameraWorldPositionRef.current[2] = cameraWorldTargetRef.current[2]
        + directionState.cameraPosition[2] - directionState.target[2];
    }
    const controls = orbitControlsRef.current;
    const cameraTransition = cameraTransitionRef.current;
    if (cameraTransition.active) {
      if (cameraTransition.kind === "presentation") {
        cameraTransition.endTarget.set(
          cameraWorldTargetRef.current[0],
          cameraWorldTargetRef.current[1],
          cameraWorldTargetRef.current[2],
        );
        cameraTransition.endPosition.set(
          cameraWorldPositionRef.current[0],
          cameraWorldPositionRef.current[1],
          cameraWorldPositionRef.current[2],
        );
      }
      cameraTransition.elapsedSeconds += safeDeltaSeconds;
      const linearProgress = Math.min(
        1,
        cameraTransition.elapsedSeconds / Math.max(0.001, cameraTransition.durationSeconds),
      );
      const transitionProgress = linearProgress * linearProgress * (3 - 2 * linearProgress);
      camera.position.lerpVectors(
        cameraTransition.startPosition,
        cameraTransition.endPosition,
        transitionProgress,
      );
      inspectionWorldCenterRef.current.lerpVectors(
        cameraTransition.startTarget,
        cameraTransition.endTarget,
        transitionProgress,
      );
      if (controls) {
        controls.target.copy(inspectionWorldCenterRef.current);
        controls.update();
      } else {
        camera.lookAt(inspectionWorldCenterRef.current);
      }
      if (linearProgress >= 1) {
        cameraTransition.active = false;
        onCameraTransitioningChange(false);
      }
    } else if (inspectionState.mode === "presentation") {
      camera.position.set(
        cameraWorldPositionRef.current[0],
        cameraWorldPositionRef.current[1],
        cameraWorldPositionRef.current[2],
      );
      camera.lookAt(
        cameraWorldTargetRef.current[0],
        cameraWorldTargetRef.current[1],
        cameraWorldTargetRef.current[2],
      );
    } else if (controls && networkRef.current) {
      const networkCenter = inspectionWorldCenterRef.current;
      networkRef.current.getWorldPosition(networkCenter);
      const panOffset = inspectionViewDirectionRef.current;
      panOffset.subVectors(controls.target, networkCenter);
      const maximumPanDistance = inspectionConfig.camera.maximumPanDistance;
      if (panOffset.lengthSq() > maximumPanDistance * maximumPanDistance) {
        panOffset.setLength(maximumPanDistance).add(networkCenter);
        pickingHitRef.current.subVectors(panOffset, controls.target);
        controls.target.copy(panOffset);
        camera.position.add(pickingHitRef.current);
        controls.update();
      }
    }
    if (networkRef.current) {
      const network = networkRef.current;
      const cameraLocalVector = cameraLocalVectorRef.current;
      network.updateWorldMatrix(true, false);
      cameraLocalVector.copy(camera.position);
      network.worldToLocal(cameraLocalVector);
      // Anchors are consumed directly as normalized network-local graph coordinates.
      cameraLocalPositionRef.current[0] = Number.isFinite(cameraLocalVector.x)
        ? cameraLocalVector.x
        : 0;
      cameraLocalPositionRef.current[1] = Number.isFinite(cameraLocalVector.y)
        ? cameraLocalVector.y
        : 0;
      cameraLocalPositionRef.current[2] = Number.isFinite(cameraLocalVector.z)
        ? cameraLocalVector.z
        : 0;
    }

    clusterLabels.advance({
      camera,
      cameraLocalPosition: cameraLocalPositionRef.current,
      deltaSeconds: safeDeltaSeconds,
      directionState,
      elapsedSeconds: clock.getElapsedTime(),
      inspectionFocus,
      interactionMode: inspectionState.mode,
      isContextPanelOpen: inspectionState.mode === "inspection"
        && inspectionConfig.panel.enabled
        && inspectionFocus.selectedClusterId !== undefined,
      narrativeState,
      network: networkRef.current,
      viewport: { width: size.width, height: size.height },
      clusterGrammarEnabled: clusterGrammar.enabled,
      clusterGrammarVisibleTerritoryIds: clusterGrammarRuntime.visibleTerritoryIds,
    });

    const focusRegion = effectiveDirectionState.focusTargetType === "cluster"
      && effectiveDirectionState.focusTargetId
      ? topologyVisualState.lookups.clusterRegionById[effectiveDirectionState.focusTargetId]
      : undefined;
    if (focusHaloRef.current && focusHaloMaterialRef.current) {
      const halo = focusHaloRef.current;
      const material = focusHaloMaterialRef.current;
      const haloResponse = semanticVisualizationConfig.transition.activationResponse;
      halo.quaternion.copy(camera.quaternion);
      if (focusRegion) {
        if (networkRef.current) {
          pickingCenterRef.current.set(
            focusRegion.center[0],
            focusRegion.center[1],
            focusRegion.center[2],
          );
          pickingCenterRef.current.applyMatrix4(networkRef.current.matrixWorld);
          haloWorldPositionRef.current[0] = pickingCenterRef.current.x;
          haloWorldPositionRef.current[1] = pickingCenterRef.current.y;
          haloWorldPositionRef.current[2] = pickingCenterRef.current.z;
        }
        halo.position.x = dampNeuralCoreSceneDirectionValue(
          halo.position.x,
          haloWorldPositionRef.current[0],
          sceneDirectionConfig.camera.targetResponse,
          safeDeltaSeconds,
        );
        halo.position.y = dampNeuralCoreSceneDirectionValue(
          halo.position.y,
          haloWorldPositionRef.current[1],
          sceneDirectionConfig.camera.targetResponse,
          safeDeltaSeconds,
        );
        halo.position.z = dampNeuralCoreSceneDirectionValue(
          halo.position.z,
          haloWorldPositionRef.current[2],
          sceneDirectionConfig.camera.targetResponse,
          safeDeltaSeconds,
        );
        const haloScale = focusRegion.radius * networkScale
          * (1.2 + effectiveDirectionState.targetEmphasis * 0.1)
          * narrativeConfig.focusIndicator.scaleMultiplier;
        const nextScale = dampNeuralCoreSceneDirectionValue(
          halo.scale.x,
          haloScale,
          haloResponse,
          safeDeltaSeconds,
        );
        halo.scale.setScalar(nextScale);
        const clusterIndex = semanticVisualRuntime?.clusterIndexById[focusRegion.clusterId];
        const clusterColor = clusterIndex === undefined
          ? semanticVisualizationConfig.color.active
          : semanticVisualState.clusterEffects[clusterIndex]?.color
            ?? semanticVisualizationConfig.color.active;
        haloTargetColor.set(clusterColor);
        material.color.lerp(
          haloTargetColor,
          1 - Math.exp(-semanticVisualizationConfig.transition.colorResponse * safeDeltaSeconds),
        );
      }
      const focusIndicatorVisible = narrativeConfig.focusIndicator.enabled
        && narrativeConfig.focusIndicator.mode !== "hidden";
      const inspectionEnvelopeActive = inspectionVisibility.enabled
        && (
          clusterGrammar.enabled
          || inspectionConfig.visualDensity.selectedClusterEnvelope.enabled
        );
      const targetHaloOpacity = focusRegion && focusIndicatorVisible && !inspectionEnvelopeActive
        ? Math.min(
          narrativeConfig.focusIndicator.maximumOpacity,
          effectiveDirectionState.haloIntensity
            * (0.026 + Math.min(1.35, effectiveDirectionState.targetEmphasis) * 0.038),
        )
        : 0;
      material.opacity = dampNeuralCoreSceneDirectionValue(
        material.opacity,
        targetHaloOpacity,
        focusRegion
          ? haloResponse
          : semanticVisualizationConfig.transition.releaseResponse,
        safeDeltaSeconds,
      );
      halo.visible = material.opacity > 0.001;
    }

    if (selectedEnvelopeRef.current && selectedEnvelopeMaterialRef.current) {
      const envelope = selectedEnvelopeRef.current;
      const material = selectedEnvelopeMaterialRef.current;
      const envelopeConfig = inspectionConfig.visualDensity.selectedClusterEnvelope;
      const selectedRegion = inspectionFocus.selectedClusterId
        ? topologyVisualState.lookups.clusterRegionById[inspectionFocus.selectedClusterId]
        : undefined;
      const envelopeActive = inspectionVisibility.enabled
        && !clusterGrammar.enabled
        && envelopeConfig.enabled
        && selectedRegion !== undefined;
      if (selectedRegion && networkRef.current) {
        pickingCenterRef.current.set(
          selectedRegion.center[0],
          selectedRegion.center[1],
          selectedRegion.center[2],
        );
        pickingCenterRef.current.applyMatrix4(networkRef.current.matrixWorld);
        envelope.position.x = dampNeuralCoreSceneDirectionValue(
          envelope.position.x,
          pickingCenterRef.current.x,
          sceneDirectionConfig.camera.targetResponse,
          safeDeltaSeconds,
        );
        envelope.position.y = dampNeuralCoreSceneDirectionValue(
          envelope.position.y,
          pickingCenterRef.current.y,
          sceneDirectionConfig.camera.targetResponse,
          safeDeltaSeconds,
        );
        envelope.position.z = dampNeuralCoreSceneDirectionValue(
          envelope.position.z,
          pickingCenterRef.current.z,
          sceneDirectionConfig.camera.targetResponse,
          safeDeltaSeconds,
        );
        networkRef.current.getWorldQuaternion(envelope.quaternion);
        const targetEnvelopeScale = selectedRegion.radius
          * networkScale
          * envelopeConfig.scaleMultiplier;
        envelope.scale.x = dampNeuralCoreSceneDirectionValue(
          envelope.scale.x,
          targetEnvelopeScale,
          semanticVisualizationConfig.transition.activationResponse,
          safeDeltaSeconds,
        );
        envelope.scale.y = dampNeuralCoreSceneDirectionValue(
          envelope.scale.y,
          targetEnvelopeScale * 0.78,
          semanticVisualizationConfig.transition.activationResponse,
          safeDeltaSeconds,
        );
        envelope.scale.z = dampNeuralCoreSceneDirectionValue(
          envelope.scale.z,
          targetEnvelopeScale * 0.9,
          semanticVisualizationConfig.transition.activationResponse,
          safeDeltaSeconds,
        );
        const clusterIndex = semanticVisualRuntime?.clusterIndexById[selectedRegion.clusterId];
        const clusterColor = clusterIndex === undefined
          ? semanticVisualizationConfig.color.active
          : semanticVisualState.clusterEffects[clusterIndex]?.color
            ?? semanticVisualizationConfig.color.active;
        haloTargetColor.set(clusterColor);
        const envelopeColor = material.uniforms.uColor?.value as Color | undefined;
        envelopeColor?.lerp(
          haloTargetColor,
          1 - Math.exp(-semanticVisualizationConfig.transition.colorResponse * safeDeltaSeconds),
        );
      }
      const densityEnvelopeWeight = inspectionVisibility.microWeight
        + inspectionVisibility.mesoWeight * 0.28;
      const targetEnvelopeOpacity = envelopeActive
        ? envelopeConfig.maximumOpacity
          * densityEnvelopeWeight
          * (1 + propagationActivity * envelopeConfig.pulseInfluence)
        : 0;
      material.uniforms.uOpacity.value = dampNeuralCoreSceneDirectionValue(
        Number(material.uniforms.uOpacity.value),
        Math.min(envelopeConfig.maximumOpacity, targetEnvelopeOpacity),
        envelopeActive
          ? semanticVisualizationConfig.transition.activationResponse
          : semanticVisualizationConfig.transition.releaseResponse,
        safeDeltaSeconds,
      );
      material.uniforms.uEdgeSoftness.value = envelopeConfig.edgeSoftness;
      envelope.visible = Number(material.uniforms.uOpacity.value) > 0.001;
    }

    const environmentContextAmount = sceneDirectionConfig.focus.maximumContextDim <= 0
      ? 0
      : Math.min(
        1,
        Math.max(
          0,
          effectiveDirectionState.contextDim
            / sceneDirectionConfig.focus.maximumContextDim,
        ),
      );
    const narrativeEnvironmentOpacity = narrativeState.isActive
      ? 1 - narrativeState.contextDim * 0.56
      : 1;
    const environmentOpacity = effectiveDirectionState.isOverview
      ? 1
      : Math.max(
        sceneDirectionConfig.focus.minimumPeripheralOpacity,
        effectiveDirectionState.peripheralOpacity,
        1 - environmentContextAmount
          * (1 - sceneDirectionConfig.focus.contextParticleOpacity),
      );
    const ambientComposition = writeNeuralCoreElementVisualComposition(
      SCENE_VISUAL_COMPOSITION,
      "ambient",
      "ambient",
      environmentOpacity * narrativeEnvironmentOpacity,
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
    const semanticLensActive = clusterGrammar.enabled && focusLensRuntime.enabled;
    const ambientCompositionOpacity = semanticLensActive
      ? Math.max(
        ambientComposition.opacity,
        focusLensRuntime.brainContext.ambientOpacity,
      )
      : ambientComposition.opacity;
    if (particleMaterialRef.current) {
      const opacityUniform = particleMaterialRef.current.uniforms.uOpacity;
      const ambientOpacity = graph.particleField.opacity * ambientCompositionOpacity;
      opacityUniform.value = dampNeuralCoreSceneDirectionValue(
        Number(opacityUniform.value),
        ambientOpacity,
        semanticVisualizationConfig.transition.releaseResponse,
        safeDeltaSeconds,
      );
    }
    if (ambientPulseMaterialRef.current) {
      const opacityUniform = ambientPulseMaterialRef.current.uniforms.uOpacity;
      const ambientPulseOpacity = graph.pulseField.opacity
        * ambientCompositionOpacity
        * (
          operationalTransmissionActive
            ? NEURAL_CORE_OPERATIONAL_PROTAGONIST_MARKER_CONFIG
              .backgroundAmbientPulseMultiplier
            : 1
        );
      opacityUniform.value = dampNeuralCoreSceneDirectionValue(
        Number(opacityUniform.value),
        ambientPulseOpacity,
        operationalTransmissionActive
          ? semanticVisualizationConfig.transition.activationResponse
          : semanticVisualizationConfig.transition.releaseResponse,
        safeDeltaSeconds,
      );
    }

    const decorativeComposition = writeNeuralCoreElementVisualComposition(
      SCENE_VISUAL_COMPOSITION,
      "decorative",
      "decorative",
      1,
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
    const decorativeOpacity = semanticLensActive
      ? Math.max(
        decorativeComposition.opacity,
        0.26 + focusLensRuntime.brainShellWeight * 0.12,
      )
      : decorativeComposition.opacity;
    updateDecorativeGroupOpacity(
      ringRef.current,
      decorativeOpacity,
      semanticVisualizationConfig.transition.releaseResponse,
      safeDeltaSeconds,
    );
    updateDecorativeGroupOpacity(
      baseRef.current,
      decorativeOpacity,
      semanticVisualizationConfig.transition.releaseResponse,
      safeDeltaSeconds,
    );

    if (baseRef.current) {
      baseRef.current.rotation.y = elapsedTime * 0.035;
      baseRef.current.scale.setScalar(
        1 + Math.sin(elapsedTime * 0.72) * 0.014 * motion.smoothedBreathingMultiplier,
      );
    }

    if (ringRef.current) {
      animateRingGroup(ringRef.current, elapsedTime);
    }

    if (hubRef.current) {
      animatePulseGroup(
        hubRef.current,
        elapsedTime,
        0.058,
        propagationBuffers.nodeActivationById,
        semanticBuffers.nodeBufferIndexById,
        semanticBuffers.nodeField,
        semanticVisualizationConfig.failure.maximumNodeFragmentationDistance,
        semanticVisualizationConfig.failure.nodeDecayThresholdSpread,
        clusterGrammar.enabled
          ? clusterGrammarBuffers.nodeOpacitiesByGraphIndex
          : undefined,
      );
    }

    if (coreRef.current) {
      animatePulseGroup(
        coreRef.current,
        elapsedTime,
        0.06,
        propagationBuffers.nodeActivationById,
        semanticBuffers.nodeBufferIndexById,
        semanticBuffers.nodeField,
        semanticVisualizationConfig.failure.maximumNodeFragmentationDistance,
        semanticVisualizationConfig.failure.nodeDecayThresholdSpread,
        clusterGrammar.enabled
          ? clusterGrammarBuffers.nodeOpacitiesByGraphIndex
          : undefined,
      );
    }

    if (particlePositionRef.current) {
      updateParticlePositions(
        particlePositionRef.current,
        graph.particles,
        motion.particleTime,
      );
    }

    if (pulsePositionRef.current && pulseColorRef.current) {
      updateAmbientPulseAttributes(
        pulsePositionRef.current,
        pulseColorRef.current,
        graph.pulses,
        elapsedTime,
      );
    }

    const sceneFog = scene.fog;
    if (sceneFog instanceof Fog) {
      const dynamicInspectionFog = inspectionState.mode === "inspection"
        && inspectionConfig.cameraRendering.enabled
        && (
          inspectionConfig.cameraRendering.fog.dynamicEnvironmentFog
          || inspectionConfig.cameraRendering.fog.preserveFunctionalTopology
        );
      const functionalFogRelease = dynamicInspectionFog
        ? 1 - cameraProfile.fogInfluence
        : 0;
      const targetFogFar = dynamicInspectionFog
        ? Math.max(
          PRESENTATION_FOG_FAR,
          relevantCameraDistance
            + networkFogDepth * (networkRef.current?.scale.x ?? 1)
            + inspectionConfig.cameraRendering.fog.farMargin * functionalFogRelease,
        )
        : PRESENTATION_FOG_FAR;
      const targetFogNear = dynamicInspectionFog
        ? PRESENTATION_FOG_NEAR * (1 - functionalFogRelease)
          + (
            relevantCameraDistance
              + networkFogDepth * (networkRef.current?.scale.x ?? 1)
              + inspectionConfig.cameraRendering.fog.farMargin * 0.25
          ) * functionalFogRelease
        : PRESENTATION_FOG_NEAR;
      sceneFog.near = dampNeuralCoreSceneDirectionValue(
        sceneFog.near,
        targetFogNear,
        inspectionConfig.cameraRendering.transitionDamping,
        safeDeltaSeconds,
      );
      sceneFog.far = dampNeuralCoreSceneDirectionValue(
        sceneFog.far,
        targetFogFar,
        inspectionConfig.cameraRendering.transitionDamping,
        safeDeltaSeconds,
      );
    }
  });

  return (
    <NeuralCoreSceneView
      ambientPulseMaterialRef={ambientPulseMaterialRef}
      baseRef={baseRef}
      clusterActivationColorRef={clusterActivationColorRef}
      clusterActivationField={propagationBuffers.clusterField}
      clusterActivationGeometryRef={clusterActivationGeometryRef}
      clusterActivationPositionRef={clusterActivationPositionRef}
      clusterActivationOpacityRef={clusterActivationOpacityRef}
      clusterActivationSizeRef={clusterActivationSizeRef}
      clusterLabelOverlay={clusterLabelConfig.enabled ? (
        <NeuralCoreClusterLabelOverlay
          models={clusterLabels.models}
          fadeInSeconds={clusterLabelConfig.visibility.fadeInSeconds}
          fadeOutSeconds={clusterLabelConfig.visibility.fadeOutSeconds}
          interactionMode={inspectionState.mode}
          selectedClusterId={inspectionState.selectedClusterId}
          onSelectCluster={onSelectCluster}
          registerLabelElement={clusterLabels.registerLabelElement}
          registerLeaderLineElement={clusterLabels.registerLeaderLineElement}
          registerOverlayElement={clusterLabels.registerOverlayElement}
        />
      ) : undefined}
      inspectionCameraControls={(
        <OrbitControls
          ref={orbitControlsRef}
          enabled={inspectionState.mode === "inspection"}
          enableDamping
          dampingFactor={inspectionConfig.camera.dampingFactor}
          enablePan={inspectionConfig.camera.allowPan}
          enableRotate={inspectionConfig.camera.allowRotate}
          enableZoom={inspectionConfig.camera.allowZoom}
          minDistance={inspectionConfig.camera.minimumDistance}
          maxDistance={inspectionConfig.camera.maximumDistance}
          minPolarAngle={inspectionConfig.camera.minimumPolarAngle}
          maxPolarAngle={inspectionConfig.camera.maximumPolarAngle}
          screenSpacePanning
          onStart={cancelCameraTransition}
        />
      )}
      connectionBuffers={graph.connectionBuffers}
      connectionFields={semanticBuffers.connectionFields}
      connectionRef={connectionRef}
      coreNodes={graph.coreNodes}
      coreRef={coreRef}
      focusHaloMaterialRef={focusHaloMaterialRef}
      focusHaloRef={focusHaloRef}
      selectedEnvelopeMaterialRef={selectedEnvelopeMaterialRef}
      selectedEnvelopeRef={selectedEnvelopeRef}
      hubRef={hubRef}
      hubs={graph.hubs}
      networkRef={networkRef}
      nodeClouds={graph.nodeClouds}
      nodeCloudRef={nodeCloudRef}
      particleField={graph.particleField}
      particleMaterialRef={particleMaterialRef}
      particlePositionRef={particlePositionRef}
      propagationPulseColorRef={propagationPulseColorRef}
      propagationPulseField={propagationBuffers.pulseField}
      propagationPulseGeometryRef={propagationPulseGeometryRef}
      propagationPulsePositionRef={propagationPulsePositionRef}
      propagationPulseOpacityRef={propagationPulseOpacityRef}
      propagationPulseSizeRef={propagationPulseSizeRef}
      operationalProtagonistMarkerColorRef={operationalProtagonistMarkerColorRef}
      operationalProtagonistMarkerField={
        propagationBuffers.operationalProtagonistMarkerField
      }
      operationalProtagonistMarkerGeometryRef={operationalProtagonistMarkerGeometryRef}
      operationalProtagonistMarkerMaterialRef={operationalProtagonistMarkerMaterialRef}
      operationalProtagonistMarkerOpacityRef={operationalProtagonistMarkerOpacityRef}
      operationalProtagonistMarkerPositionRef={operationalProtagonistMarkerPositionRef}
      operationalProtagonistMarkerSizeRef={operationalProtagonistMarkerSizeRef}
      operationalProtagonistMarkerTangentRef={operationalProtagonistMarkerTangentRef}
      propagationConfig={propagation.config}
      pulseColorRef={pulseColorRef}
      pulseField={graph.pulseField}
      pulsePositionRef={pulsePositionRef}
      ringRef={ringRef}
      rings={graph.rings}
      semanticPointCloudFields={semanticBuffers.pointCloudFields}
      semanticRibbonAttributeRefs={{
        color: semanticRibbonColorRef,
        fragmentation: semanticRibbonFragmentationRef,
        instability: semanticRibbonInstabilityRef,
        interruption: semanticRibbonInterruptionRef,
        opacity: semanticRibbonOpacityRef,
        pulseFrequency: semanticRibbonPulseFrequencyRef,
        pulseIntensity: semanticRibbonPulseIntensityRef,
        thickness: semanticRibbonThicknessRef,
      }}
      semanticRibbonField={semanticBuffers.ribbonField}
      semanticRibbonMaterialRef={semanticRibbonMaterialRef}
      semanticVisualizationConfig={semanticVisualizationConfig}
      clusterGrammarBufferState={clusterGrammarBuffers}
      clusterGrammarConnectionOpacityRefs={clusterGrammarConnectionOpacityRefs}
      clusterGrammarNodeOpacityRefs={clusterGrammarNodeOpacityRefs}
      clusterGrammarRibbonOpacityRef={clusterGrammarRibbonOpacityRef}
      clusterGrammarVisuals={clusterGrammar.enabled ? (
        <>
          <NeuralCoreClusterTerritoriesView
            focusLensConfig={semanticFocusLensConfig}
            grammar={clusterGrammar}
            territoryRefs={clusterTerritoryRefs}
          />
          <NeuralCoreAggregatedRoutesView
            pulseColorRef={aggregatedPulseColorRef}
            pulseField={aggregatedPulseField}
            pulseGeometryRef={aggregatedPulseGeometryRef}
            pulseOpacityRef={aggregatedPulseOpacityRef}
            pulsePositionRef={aggregatedPulsePositionRef}
            pulseSizeRef={aggregatedPulseSizeRef}
            routeField={aggregatedRouteField}
            routeColorRef={aggregatedRouteColorRef}
            routeOpacityRef={aggregatedRouteOpacityRef}
            routeThicknessRef={aggregatedRouteThicknessRef}
          />
        </>
      ) : undefined}
      stableFunctionalBlending={
        inspectionState.mode === "inspection"
          && inspectionConfig.cameraRendering.enabled
          && inspectionFocus.selectedClusterId !== undefined
      }
    />
  );
};
