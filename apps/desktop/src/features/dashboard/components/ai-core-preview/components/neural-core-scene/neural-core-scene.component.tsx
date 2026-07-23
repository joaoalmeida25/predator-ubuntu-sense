import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ComponentRef,
  type ReactElement,
} from "react";
import { Color, type
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
      material.opacity = baseOpacity * semanticOpacity * (1 - opacityDecay * 0.96);
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
  cameraResetRevision,
  inspectionConfig,
  inspectionFocus,
  inspectionState,
  onCameraTransitioningChange,
  onSelectCluster,
}: NeuralCoreSceneProps): ReactElement => {
  const { camera: sceneCamera, gl } = useThree();
  const ambientPulseMaterialRef = useRef<ShaderMaterial | null>(null);
  const baseRef = useRef<Group | null>(null);
  const clusterActivationColorRef = useRef<BufferAttribute | null>(null);
  const clusterActivationGeometryRef = useRef<BufferGeometry | null>(null);
  const clusterActivationPositionRef = useRef<BufferAttribute | null>(null);
  const clusterActivationOpacityRef = useRef<BufferAttribute | null>(null);
  const clusterActivationSizeRef = useRef<BufferAttribute | null>(null);
  const connectionRef = useRef<Group | null>(null);
  const coreRef = useRef<Group | null>(null);
  const focusHaloMaterialRef = useRef<MeshBasicMaterial | null>(null);
  const focusHaloRef = useRef<Mesh | null>(null);
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
  const visualDensityRuntimeRef = useRef(createNeuralCoreVisualDensityRuntime());
  const spatialMapRuntimeRef = useRef<NeuralCoreSpatialMap | undefined>(undefined);
  const choreographyLoopRuntimeRef = useRef<NeuralCoreSceneChoreographyLoopRuntime>({
    timelineSeconds: 0,
  });
  const narrativePhaseKeyRef = useRef("");
  const simulationElapsedSecondsRef = useRef(0);
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
  const haloTargetColor = useMemo(() => new Color("#82efff"), []);
  const graph = useMemo(() => createNeuralCoreGraph(), []);
  const propagation = useNeuralCorePropagation({
    topology,
    config: propagationConfig,
    onPropagationEvent,
    resetKey: runtimeScenarioKey,
  });
  const choreographyRuntime = useNeuralCoreChoreography({
    choreography,
    config: semanticVisualizationConfig,
    resetKey: runtimeScenarioKey,
  });
  const spatialTopology = propagation.plan?.topology ?? EMPTY_NEURAL_CORE_TOPOLOGY;
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
      topology: propagation.plan?.topology,
      graph,
      config: semanticVisualizationConfig.topology,
      spatialMap: resolvedSpatialMap,
    });
  }, [graph, propagation.plan, resolvedSpatialMap, semanticVisualizationConfig.topology]);
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
  const clusterLabels = useNeuralCoreClusterLabels({
    config: clusterLabelConfig,
    lodConfig,
    runtimeScenarioKey,
    spatialMap: resolvedSpatialMap,
    topology: spatialTopology,
    topologyVisualState,
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
  useEffect(() => {
    semanticBufferStateRef.current = semanticBuffers;
  }, [semanticBuffers]);

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
    simulationElapsedSecondsRef.current += simulationDeltaSeconds;
    const elapsedTime = simulationElapsedSecondsRef.current;
    const propagationVisualState = propagation.advance(simulationDeltaSeconds);
    const choreographyEvaluation = choreographyRuntime.advance(simulationDeltaSeconds);
    const directionState = directionRuntime.advance(
      inspectionState.mode === "presentation" ? simulationDeltaSeconds : 0,
    );
    const effectiveDirectionState = inspectionState.mode === "inspection"
      ? inspectionDirectionState
      : directionState;
    const narrativeState = narrativeRuntime.advance(
      simulationDeltaSeconds,
      choreography ? choreographyEvaluation.timelineSeconds : undefined,
    );
    const narrativeVisualState = mapNeuralCoreNarrativeToVisualState(narrativeState);
    const cameraLocalPosition = cameraLocalPositionRef.current;
    const visualDensity = updateNeuralCoreVisualDensityRuntime(
      visualDensityRuntimeRef.current,
      inspectionConfig.visualDensity,
      Math.hypot(
        cameraLocalPosition[0],
        cameraLocalPosition[1],
        cameraLocalPosition[2],
      ),
      safeDeltaSeconds,
      inspectionState.mode,
      inspectionFocus.selectedClusterId !== undefined,
    );
    const narrativePhaseKey = [
      narrativeState.narrativeId ?? "none",
      narrativeState.activePhaseId ?? "idle",
      narrativeState.isActive ? "active" : "inactive",
    ].join(":");
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
      )
      : EMPTY_NEURAL_CORE_SEMANTIC_VISUAL_STATE;

    const { clusterPointCount, pulsePointCount } = updateNeuralCorePropagationBuffers(
      propagationBuffers,
      propagationVisualState,
      topologyVisualState,
      propagation.config.pulse.trailSampleCount,
      effectiveDirectionState,
      sceneDirectionConfig,
      propagation.config,
      visualDensity,
    );
    propagationPulseGeometryRef.current?.setDrawRange(0, pulsePointCount);
    clusterActivationGeometryRef.current?.setDrawRange(0, clusterPointCount);
    markAttributeForUpdate(propagationPulsePositionRef.current);
    markAttributeForUpdate(propagationPulseColorRef.current);
    markAttributeForUpdate(propagationPulseOpacityRef.current);
    markAttributeForUpdate(propagationPulseSizeRef.current);
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
      visualDensity,
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
      semanticRibbonMaterialRef.current.uniforms.uTime.value = elapsedTime;
      semanticRibbonMaterialRef.current.uniforms.uResolution.value.x = size.width;
      semanticRibbonMaterialRef.current.uniforms.uResolution.value.y = size.height;
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
      const targetHaloOpacity = focusRegion && focusIndicatorVisible
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
    if (particleMaterialRef.current) {
      const opacityUniform = particleMaterialRef.current.uniforms.uOpacity;
      opacityUniform.value = dampNeuralCoreSceneDirectionValue(
        Number(opacityUniform.value),
        graph.particleField.opacity
          * environmentOpacity
          * narrativeEnvironmentOpacity
          * visualDensity.ambientParticleOpacity,
        semanticVisualizationConfig.transition.releaseResponse,
        safeDeltaSeconds,
      );
    }
    if (ambientPulseMaterialRef.current) {
      const opacityUniform = ambientPulseMaterialRef.current.uniforms.uOpacity;
      opacityUniform.value = dampNeuralCoreSceneDirectionValue(
        Number(opacityUniform.value),
        graph.pulseField.opacity
          * environmentOpacity
          * narrativeEnvironmentOpacity
          * visualDensity.ambientParticleOpacity,
        semanticVisualizationConfig.transition.releaseResponse,
        safeDeltaSeconds,
      );
    }

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
    />
  );
};
