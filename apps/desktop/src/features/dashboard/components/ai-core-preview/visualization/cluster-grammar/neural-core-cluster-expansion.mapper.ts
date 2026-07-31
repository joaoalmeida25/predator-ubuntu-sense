import type { NeuralCoreGraph } from "../graph/neural-core-graph.types";
import type {
  NeuralCoreSemanticBufferState,
} from "../semantic/neural-core-semantic-buffer.types";
import type {
  NeuralCorePropagationVisualState,
} from "../propagation/neural-core-propagation-visual.types";
import type {
  NeuralCoreClusterGrammarBufferState,
  NeuralCoreClusterGrammarConfig,
  NeuralCoreClusterGrammarDensity,
  NeuralCoreClusterGrammarFocus,
  NeuralCoreClusterGrammarRuntime,
  NeuralCoreClusterGrammarState,
  NeuralCoreClusterVisualState,
} from "./neural-core-cluster-grammar.types";
import {
  dampNeuralCoreClusterGrammarValue,
  shouldIncludeNeuralCoreVisualSample,
} from "./neural-core-cluster-grammar.utils";
import type {
  NeuralCoreSemanticFocusLensConfig,
  NeuralCoreSemanticFocusLensState,
} from "../focus-lens/neural-core-semantic-focus-lens.types";

const hasId = (ids: readonly string[], id: string): boolean => ids.includes(id);

const PERSISTENT_NEURAL_SCAFFOLD = {
  contextNodeOpacity: 0.68,
  corticalNodeOpacity: 0.9,
  relatedNodeOpacity: 0.82,
  protagonistNodeOpacity: 0.96,
  contextConnectionOpacity: 0.62,
  corticalConnectionOpacity: 0.88,
  relatedConnectionOpacity: 0.82,
  protagonistConnectionOpacity: 0.96,
  protagonistRouteOpacity: 0.82,
  relatedRouteOpacity: 0.58,
  protagonistPulseOpacity: 0.86,
  relatedPulseOpacity: 0.64,
} as const;

const createClusterState = (
  clusterId: string,
  config: NeuralCoreClusterGrammarConfig,
): NeuralCoreClusterVisualState => ({
  clusterId,
  mode: "territory",
  territoryOpacity: 1,
  territoryScale: 1,
  territoryEmphasis: 0,
  hubOpacity: 0.72,
  hubScale: 1,
  internalNodeOpacity: config.macro.internalNodeSampleRatio,
  internalConnectionOpacity: config.macro.internalConnectionSampleRatio,
  boundaryOpacity: 0.11,
  activityIntensity: 0,
  isSelected: false,
  isRelated: false,
  isProtagonist: false,
});

export const createNeuralCoreClusterGrammarRuntime = (
  grammar: NeuralCoreClusterGrammarState,
  config: NeuralCoreClusterGrammarConfig,
): NeuralCoreClusterGrammarRuntime => ({
  clusterStates: grammar.territories.map((territory) => {
    return createClusterState(territory.clusterId, config);
  }),
  routeStates: grammar.routes.map((route) => ({
    routeId: route.id,
    opacity: 0,
    thickness: 1,
    emphasis: 0,
    pulseOpacity: 0,
    detailOpacity: 0,
    priority: 0,
    isVisible: false,
    isActive: false,
    isRelated: false,
    isProtagonist: false,
  })),
  visibleTerritoryIds: grammar.territories
    .map((territory) => territory.clusterId),
});

const countHigherTerritoryPriorities = (
  grammar: NeuralCoreClusterGrammarState,
  index: number,
): number => {
  const territory = grammar.territories[index];
  let higher = 0;
  for (let candidateIndex = 0; candidateIndex < grammar.territories.length; candidateIndex += 1) {
    if (candidateIndex === index) {
      continue;
    }
    const candidate = grammar.territories[candidateIndex];
    if (
      candidate.priority > territory.priority
      || (
        candidate.priority === territory.priority
        && candidate.clusterId.localeCompare(territory.clusterId) < 0
      )
    ) {
      higher += 1;
    }
  }
  return higher;
};

const routeMatchesIds = (
  synapseIds: readonly string[],
  pathwayIds: readonly string[],
  focus: NeuralCoreClusterGrammarFocus,
): boolean => {
  for (const synapseId of synapseIds) {
    if (focus.narrativeSynapseIds.includes(synapseId)) {
      return true;
    }
  }
  for (const pathwayId of pathwayIds) {
    if (focus.narrativePathwayIds.includes(pathwayId)) {
      return true;
    }
  }
  return false;
};

const isRouteActive = (
  synapseIds: readonly string[],
  propagationVisualState: NeuralCorePropagationVisualState,
): boolean => {
  for (const pulse of propagationVisualState.pulses) {
    if (synapseIds.includes(pulse.synapseId) && pulse.intensity > 0.02) {
      return true;
    }
  }
  for (const activation of propagationVisualState.synapseActivations) {
    if (synapseIds.includes(activation.synapseId) && activation.opacity > 0.02) {
      return true;
    }
  }
  return false;
};

const getClusterPropagationActivity = (
  clusterId: string,
  propagationVisualState: NeuralCorePropagationVisualState,
): number => {
  let activity = 0;
  for (const activation of propagationVisualState.clusterActivations) {
    if (activation.clusterId === clusterId) {
      activity = Math.max(activity, activation.intensity);
    }
  }
  return activity;
};

const countHigherRoutePriorities = (
  runtime: NeuralCoreClusterGrammarRuntime,
  index: number,
): number => {
  const route = runtime.routeStates[index];
  let higher = 0;
  for (let candidateIndex = 0; candidateIndex < runtime.routeStates.length; candidateIndex += 1) {
    if (candidateIndex === index) {
      continue;
    }
    const candidate = runtime.routeStates[candidateIndex];
    if (
      candidate.priority > route.priority
      || (
        candidate.priority === route.priority
        && candidate.routeId.localeCompare(route.routeId) < 0
      )
    ) {
      higher += 1;
    }
  }
  return higher;
};

export const updateNeuralCoreClusterGrammarRuntime = (
  runtime: NeuralCoreClusterGrammarRuntime,
  grammar: NeuralCoreClusterGrammarState,
  config: NeuralCoreClusterGrammarConfig,
  focus: NeuralCoreClusterGrammarFocus,
  density: NeuralCoreClusterGrammarDensity,
  propagationVisualState: NeuralCorePropagationVisualState,
  focusLensState: NeuralCoreSemanticFocusLensState,
  focusLensConfig: NeuralCoreSemanticFocusLensConfig,
  deltaSeconds: number,
): void => {
  if (!grammar.enabled) {
    return;
  }
  const hasSelection = focus.selectedClusterId !== undefined;
  runtime.visibleTerritoryIds.length = 0;
  for (let index = 0; index < runtime.clusterStates.length; index += 1) {
    const state = runtime.clusterStates[index];
    const territory = grammar.territories[index];
    const isSelected = territory.clusterId === focus.selectedClusterId;
    const isNarrativeRelated = hasId(
      focus.narrativeClusterIds,
      territory.clusterId,
    );
    const isProtagonist = territory.clusterId === focus.protagonistClusterId;
    const isRelated = hasId(focus.relatedClusterIds, territory.clusterId)
      || (isNarrativeRelated && !isProtagonist);
    const macroRank = countHigherTerritoryPriorities(grammar, index);
    const isMacroVisible = macroRank < config.macro.maximumVisibleTerritories
      || isProtagonist
      || isRelated
      || isSelected;
    let relatedRank = 0;
    if (isRelated) {
      for (let candidateIndex = 0; candidateIndex < index; candidateIndex += 1) {
        if (hasId(focus.relatedClusterIds, grammar.territories[candidateIndex].clusterId)) {
          relatedRank += 1;
        }
      }
    }
    const isPrioritizedRelated = isRelated
      && relatedRank < config.meso.maximumRelatedTerritories;
    if (
      isSelected
      || (hasSelection ? isPrioritizedRelated : isMacroVisible)
    ) {
      runtime.visibleTerritoryIds.push(territory.clusterId);
    }
    state.mode = isSelected ? "expanded" : hasSelection ? "context" : "territory";
    state.isSelected = isSelected;
    state.isRelated = isRelated;
    state.isProtagonist = isProtagonist;
    const contextOpacity = hasSelection
      ? isPrioritizedRelated
        ? config.micro.relatedTerritoryOpacity
        : config.micro.contextTerritoryOpacity
      : isMacroVisible ? 1 : 0.08;
    const territoryTarget = isSelected
      ? 0.72 * density.mesoWeight + 0.42 * density.microWeight
        + 0.88 * density.macroWeight
      : contextOpacity;
    const boundaryTarget = focusLensState.enabled
      ? focusLensConfig.territory.boundaryMaximumOpacity * (
        isSelected
          ? 0.42 + focusLensState.detailProgress * 0.58
          : isPrioritizedRelated ? 0.28 : isProtagonist ? 0.24 : 0.16
      ) * contextOpacity
      : isSelected
        ? 0.2 + density.mesoWeight * 0.16 + density.microWeight * 0.2
        : (isProtagonist ? 0.18 : 0.11) * contextOpacity;
    const hubTarget = focusLensState.enabled
      ? focusLensConfig.territory.hubMaximumBrightness * (
        isSelected ? 0.92 : isProtagonist ? 0.68 : isPrioritizedRelated ? 0.54 : 0.42
      ) * contextOpacity
      : isSelected
        ? 0.74 + density.mesoWeight * 0.12
        : (isProtagonist ? 0.94 : 0.72) * contextOpacity;
    const macroNodeOpacity = isMacroVisible
      ? config.macro.internalNodeSampleRatio
      : config.macro.internalNodeSampleRatio * 0.18;
    const nodeTarget = isSelected
      ? focusLensState.enabled
        ? Math.max(
          macroNodeOpacity,
          focusLensState.internalNodeDetailWeight,
        )
        : macroNodeOpacity * density.macroWeight
          + config.meso.internalNodeVisibility * density.mesoWeight
          + config.micro.selectedInternalNodeVisibility * density.microWeight
      : macroNodeOpacity * (hasSelection ? contextOpacity * 0.58 : 1);
    const connectionTarget = isSelected
      ? focusLensState.enabled
        ? Math.max(
          config.macro.internalConnectionSampleRatio,
          focusLensState.internalConnectionDetailWeight,
        )
        : config.macro.internalConnectionSampleRatio * density.macroWeight
          + config.meso.internalConnectionVisibility * density.mesoWeight
          + config.micro.selectedInternalConnectionVisibility * density.microWeight
      : config.macro.internalConnectionSampleRatio
        * (hasSelection ? contextOpacity * 0.46 : 1);
    state.territoryOpacity = dampNeuralCoreClusterGrammarValue(
      state.territoryOpacity,
      territoryTarget,
      config.transitionDamping,
      deltaSeconds,
    );
    state.territoryScale = dampNeuralCoreClusterGrammarValue(
      state.territoryScale,
      isSelected ? 1.08 : 1,
      config.transitionDamping,
      deltaSeconds,
    );
    state.territoryEmphasis = dampNeuralCoreClusterGrammarValue(
      state.territoryEmphasis,
      isSelected ? 1 : isProtagonist ? 0.78 : isPrioritizedRelated ? 0.46 : 0.16,
      config.transitionDamping,
      deltaSeconds,
    );
    state.hubOpacity = dampNeuralCoreClusterGrammarValue(
      state.hubOpacity,
      hubTarget,
      config.transitionDamping,
      deltaSeconds,
    );
    state.hubScale = dampNeuralCoreClusterGrammarValue(
      state.hubScale,
      focusLensState.enabled
        ? focusLensConfig.territory.hubScale
          * (isSelected ? 1.08 : isProtagonist ? 1.03 : 1)
        : isSelected ? 1.16 : isProtagonist ? 1.08 : 1,
      config.transitionDamping,
      deltaSeconds,
    );
    state.internalNodeOpacity = dampNeuralCoreClusterGrammarValue(
      state.internalNodeOpacity,
      nodeTarget,
      config.transitionDamping,
      deltaSeconds,
    );
    state.internalConnectionOpacity = dampNeuralCoreClusterGrammarValue(
      state.internalConnectionOpacity,
      connectionTarget,
      config.transitionDamping,
      deltaSeconds,
    );
    state.boundaryOpacity = dampNeuralCoreClusterGrammarValue(
      state.boundaryOpacity,
      boundaryTarget,
      config.transitionDamping,
      deltaSeconds,
    );
    state.activityIntensity = dampNeuralCoreClusterGrammarValue(
      state.activityIntensity,
      Math.max(
        territory.activity,
        getClusterPropagationActivity(territory.clusterId, propagationVisualState),
        isProtagonist ? 0.65 : 0,
      ),
      config.transitionDamping,
      deltaSeconds,
    );
  }

  for (let index = 0; index < runtime.routeStates.length; index += 1) {
    const state = runtime.routeStates[index];
    const route = grammar.routes[index];
    const isRelated = route.sourceClusterId === focus.selectedClusterId
      || route.targetClusterId === focus.selectedClusterId
      || (
        hasId(focus.relatedClusterIds, route.sourceClusterId)
        && hasId(focus.relatedClusterIds, route.targetClusterId)
      );
    const isProtagonist = routeMatchesIds(route.synapseIds, route.pathwayIds, focus)
      || (
        focus.protagonistClusterId !== undefined
        && (
          route.sourceClusterId === focus.protagonistClusterId
          || route.targetClusterId === focus.protagonistClusterId
        )
      );
    const isActive = isRouteActive(route.synapseIds, propagationVisualState);
    state.isRelated = isRelated;
    state.isProtagonist = isProtagonist;
    state.isActive = isActive;
    state.priority = route.activity * 2
      + (isProtagonist ? config.routes.protagonistPriority : 0)
      + (route.status === "error" || route.status === "warning"
        ? config.routes.criticalPriority
        : 0)
      + (route.status === "active" || route.status === "processing" || isActive
        ? config.routes.activePriority
        : 0)
      + (isRelated ? config.routes.relatedPriority : 0);
  }
  const maximumRoutes = hasSelection
    ? config.routes.maximumMesoRoutes
    : config.routes.maximumMacroRoutes;
  for (let index = 0; index < runtime.routeStates.length; index += 1) {
    const state = runtime.routeStates[index];
    const route = grammar.routes[index];
    const priorityRank = countHigherRoutePriorities(runtime, index);
    const isWithinLimit = priorityRank < maximumRoutes;
    const isVisible = isWithinLimit && (
        route.activity >= config.routes.minimumActivity
        || state.isRelated
        || state.isProtagonist
        || state.isActive
        || route.status === "error"
        || route.status === "warning"
    );
    state.isVisible = isVisible;
    const contextWeight = hasSelection ? state.isRelated ? 1 : 0.18 : 1;
    const legacyRouteTarget = !isWithinLimit
      ? 0
      : isVisible
        ? (state.isProtagonist ? 0.72 : 0.28 + route.activity * 0.3) * contextWeight
        : config.routes.inactiveOpacity * contextWeight;
    const focusLensRouteTarget = focusLensState.enabled
      ? !isWithinLimit
        ? 0
        : focusLensState.aggregatedRouteWeight
          * (state.isProtagonist ? 1 : state.isRelated ? 0.86 : 0.42)
          * contextWeight
      : legacyRouteTarget;
    const routeTarget = !isWithinLimit
      ? 0
      : state.isProtagonist
        ? Math.max(
          focusLensRouteTarget,
          PERSISTENT_NEURAL_SCAFFOLD.protagonistRouteOpacity,
        )
        : state.isRelated
          ? Math.max(
            focusLensRouteTarget,
            PERSISTENT_NEURAL_SCAFFOLD.relatedRouteOpacity,
          )
          : focusLensRouteTarget;
    const selectedDetail = hasSelection && state.isRelated
      ? density.mesoWeight * 0.48 + density.microWeight
      : 0;
    state.opacity = dampNeuralCoreClusterGrammarValue(
      state.opacity,
      focusLensState.enabled
        ? routeTarget
        : routeTarget * (1 - selectedDetail * 0.72),
      config.transitionDamping,
      deltaSeconds,
    );
    state.emphasis = dampNeuralCoreClusterGrammarValue(
      state.emphasis,
      state.isProtagonist
        ? 1
        : state.isRelated ? 0.64 : state.isActive ? 0.72 : route.activity,
      config.transitionDamping,
      deltaSeconds,
    );
    state.thickness = dampNeuralCoreClusterGrammarValue(
      state.thickness,
      focusLensState.enabled
        ? state.isProtagonist
          ? Math.max(0.92, focusLensState.aggregatedRouteThickness)
          : state.isRelated
            ? Math.max(0.72, focusLensState.aggregatedRouteThickness)
            : focusLensState.aggregatedRouteThickness
        : 1,
      config.transitionDamping,
      deltaSeconds,
    );
    state.pulseOpacity = dampNeuralCoreClusterGrammarValue(
      state.pulseOpacity,
      focusLensState.enabled
        ? state.isProtagonist
          ? Math.max(
            routeTarget * focusLensState.aggregatedActivityWeight,
            PERSISTENT_NEURAL_SCAFFOLD.protagonistPulseOpacity,
          )
          : state.isRelated
            ? Math.max(
              routeTarget * focusLensState.aggregatedActivityWeight,
              PERSISTENT_NEURAL_SCAFFOLD.relatedPulseOpacity,
            )
            : routeTarget * focusLensState.aggregatedActivityWeight
        : routeTarget * (1 - selectedDetail * 0.9),
      config.transitionDamping,
      deltaSeconds,
    );
    state.detailOpacity = dampNeuralCoreClusterGrammarValue(
      state.detailOpacity,
      focusLensState.enabled
        ? state.isProtagonist
          ? focusLensConfig.routes.microDetailedSynapseOpacity
          : state.isRelated
            ? focusLensState.detailedSynapseWeight
          : focusLensConfig.brainContext.minimumDistantConnectionOpacity
        : selectedDetail,
      config.transitionDamping,
      deltaSeconds,
    );
  }
};

export const createNeuralCoreClusterGrammarBufferState = (
  graph: NeuralCoreGraph,
  semanticBuffers: NeuralCoreSemanticBufferState,
  grammar: NeuralCoreClusterGrammarState,
  config: NeuralCoreClusterGrammarConfig,
): NeuralCoreClusterGrammarBufferState => {
  const nodeTerritoryIndices = new Int16Array(graph.nodes.length);
  nodeTerritoryIndices.fill(-1);
  grammar.territories.forEach((territory, territoryIndex): void => {
    for (const nodeId of [...territory.nodeIds, ...territory.hubNodeIds]) {
      const graphIndex = nodeId < semanticBuffers.nodeBufferIndexById.length
        ? semanticBuffers.nodeBufferIndexById[nodeId]
        : -1;
      if (graphIndex >= 0 && nodeTerritoryIndices[graphIndex] < 0) {
        nodeTerritoryIndices[graphIndex] = territoryIndex;
      }
    }
  });
  const nodeSampleMask = new Uint8Array(graph.nodes.length);
  const nodeCorticalMask = new Uint8Array(graph.nodes.length);
  graph.nodes.forEach((node, graphIndex): void => {
    nodeSampleMask[graphIndex] = shouldIncludeNeuralCoreVisualSample(
      `node:${node.id}`,
      config.macro.internalNodeSampleRatio,
    ) ? 1 : 0;
    nodeCorticalMask[graphIndex] = node.isOuter ? 1 : 0;
  });
  const connectionTerritoryIndices = graph.connectionBuffers.map((buffer) => {
    const indices = new Int16Array(buffer.connectionIds.length);
    indices.fill(-1);
    for (let index = 0; index < buffer.connectionIds.length; index += 1) {
      const fromNodeId = buffer.fromNodeIds[index];
      const toNodeId = buffer.toNodeIds[index];
      const fromGraphIndex = fromNodeId < semanticBuffers.nodeBufferIndexById.length
        ? semanticBuffers.nodeBufferIndexById[fromNodeId]
        : -1;
      const toGraphIndex = toNodeId < semanticBuffers.nodeBufferIndexById.length
        ? semanticBuffers.nodeBufferIndexById[toNodeId]
        : -1;
      const fromTerritory = fromGraphIndex >= 0 ? nodeTerritoryIndices[fromGraphIndex] : -1;
      const toTerritory = toGraphIndex >= 0 ? nodeTerritoryIndices[toGraphIndex] : -1;
      if (fromTerritory >= 0 && fromTerritory === toTerritory) {
        indices[index] = fromTerritory;
      }
    }
    return indices;
  });
  const connectionSampleMasks = graph.connectionBuffers.map((buffer) => {
    const masks = new Uint8Array(buffer.connectionIds.length);
    buffer.connectionIds.forEach((id, index): void => {
      masks[index] = shouldIncludeNeuralCoreVisualSample(
        `connection:${id}`,
        config.macro.internalConnectionSampleRatio,
      ) ? 1 : 0;
    });
    return masks;
  });
  const connectionCorticalMasks = graph.connectionBuffers.map((buffer) => {
    const masks = new Uint8Array(buffer.connectionIds.length);
    for (let index = 0; index < buffer.connectionIds.length; index += 1) {
      const fromNode = graph.nodes[buffer.fromNodeIds[index]];
      const toNode = graph.nodes[buffer.toNodeIds[index]];
      masks[index] = fromNode?.isOuter && toNode?.isOuter ? 1 : 0;
    }
    return masks;
  });
  const ribbonRouteIndices = new Int16Array(semanticBuffers.ribbonField.opacities.length);
  ribbonRouteIndices.fill(-1);
  for (const span of semanticBuffers.ribbonField.spans) {
    const routeIndex = grammar.lookups.routeIndexBySynapseId[span.semanticId] ?? -1;
    ribbonRouteIndices.fill(
      routeIndex,
      span.startVertexIndex,
      span.startVertexIndex + span.vertexCount,
    );
  }
  return {
    nodeOpacitiesByGraphIndex: new Float32Array(graph.nodes.length).fill(1),
    pointCloudOpacities: graph.nodeClouds.map(
      (cloud) => new Float32Array(cloud.nodeIds.length).fill(1),
    ),
    pointCloudGraphIndices: graph.nodeClouds.map((cloud) => {
      const indices = new Int16Array(cloud.nodeIds.length);
      indices.fill(-1);
      for (let pointIndex = 0; pointIndex < cloud.nodeIds.length; pointIndex += 1) {
        const nodeId = cloud.nodeIds[pointIndex];
        indices[pointIndex] = nodeId < semanticBuffers.nodeBufferIndexById.length
          ? semanticBuffers.nodeBufferIndexById[nodeId]
          : -1;
      }
      return indices;
    }),
    connectionOpacities: graph.connectionBuffers.map(
      (buffer) => new Float32Array(buffer.connectionIds.length * 2).fill(1),
    ),
    ribbonOpacities: new Float32Array(semanticBuffers.ribbonField.opacities.length).fill(1),
    nodeTerritoryIndices,
    nodeSampleMask,
    nodeCorticalMask,
    connectionTerritoryIndices,
    connectionSampleMasks,
    connectionCorticalMasks,
    ribbonRouteIndices,
  };
};

export const updateNeuralCoreClusterGrammarBuffers = (
  buffers: NeuralCoreClusterGrammarBufferState,
  graph: NeuralCoreGraph,
  runtime: NeuralCoreClusterGrammarRuntime,
  density: NeuralCoreClusterGrammarDensity,
  focusLensState: NeuralCoreSemanticFocusLensState,
  focusLensConfig: NeuralCoreSemanticFocusLensConfig,
): void => {
  for (let graphIndex = 0; graphIndex < buffers.nodeOpacitiesByGraphIndex.length; graphIndex += 1) {
    const territoryIndex = buffers.nodeTerritoryIndices[graphIndex];
    const state = territoryIndex >= 0 ? runtime.clusterStates[territoryIndex] : undefined;
    const sampled = buffers.nodeSampleMask[graphIndex] === 1;
    const cortical = buffers.nodeCorticalMask[graphIndex] === 1;
    if (focusLensState.enabled) {
      const shellFloor = Math.max(
        focusLensConfig.brainContext.minimumDistantNodeOpacity,
        focusLensState.brainContext.baseNodeOpacity,
        cortical
          ? PERSISTENT_NEURAL_SCAFFOLD.corticalNodeOpacity
          : PERSISTENT_NEURAL_SCAFFOLD.contextNodeOpacity,
      );
      buffers.nodeOpacitiesByGraphIndex[graphIndex] = state
        ? focusLensState.selectedClusterId === undefined
          ? state.isProtagonist
            ? PERSISTENT_NEURAL_SCAFFOLD.protagonistNodeOpacity
            : state.isRelated
              ? PERSISTENT_NEURAL_SCAFFOLD.relatedNodeOpacity
              : Math.max(shellFloor, sampled ? 0.76 : 0)
          : state.isSelected
          ? Math.max(
            PERSISTENT_NEURAL_SCAFFOLD.protagonistNodeOpacity,
            focusLensState.internalNodeDetailWeight,
            sampled ? 0.58 * focusLensState.territoryRepresentationWeight : 0,
          )
          : state.isRelated
            ? Math.max(
              PERSISTENT_NEURAL_SCAFFOLD.relatedNodeOpacity,
              focusLensState.internalNodeDetailWeight * 0.82,
            )
            : Math.max(
              shellFloor,
              sampled ? 0.76 : 0,
            )
        : Math.max(shellFloor, focusLensState.brainShellWeight * 0.5);
    } else {
      buffers.nodeOpacitiesByGraphIndex[graphIndex] = state
        ? state.isSelected
          ? state.internalNodeOpacity
          : sampled ? Math.max(0.035, state.internalNodeOpacity) : 0.012
        : 0.04 * density.macroWeight + 0.018;
    }
  }
  graph.nodeClouds.forEach((cloud, cloudIndex): void => {
    const opacities = buffers.pointCloudOpacities[cloudIndex];
    const graphIndices = buffers.pointCloudGraphIndices[cloudIndex];
    for (let pointIndex = 0; pointIndex < cloud.nodeIds.length; pointIndex += 1) {
      const graphIndex = graphIndices[pointIndex];
      opacities[pointIndex] = graphIndex >= 0
        ? buffers.nodeOpacitiesByGraphIndex[graphIndex]
        : 0.02;
    }
  });
  buffers.connectionOpacities.forEach((opacities, bufferIndex): void => {
    const territoryIndices = buffers.connectionTerritoryIndices[bufferIndex];
    const sampleMasks = buffers.connectionSampleMasks[bufferIndex];
    const corticalMasks = buffers.connectionCorticalMasks[bufferIndex];
    for (let connectionIndex = 0; connectionIndex < territoryIndices.length; connectionIndex += 1) {
      const territoryIndex = territoryIndices[connectionIndex];
      const state = territoryIndex >= 0 ? runtime.clusterStates[territoryIndex] : undefined;
      const sampled = sampleMasks[connectionIndex] === 1;
      const cortical = corticalMasks[connectionIndex] === 1;
      const scaffoldOpacity = cortical
        ? PERSISTENT_NEURAL_SCAFFOLD.corticalConnectionOpacity
        : PERSISTENT_NEURAL_SCAFFOLD.contextConnectionOpacity;
      const opacity = focusLensState.enabled
        ? state
          ? focusLensState.selectedClusterId === undefined
            ? state.isProtagonist
              ? PERSISTENT_NEURAL_SCAFFOLD.protagonistConnectionOpacity
              : state.isRelated
                ? PERSISTENT_NEURAL_SCAFFOLD.relatedConnectionOpacity
                : Math.max(scaffoldOpacity, sampled ? 0.72 : 0)
            : state.isSelected
            ? Math.max(
              PERSISTENT_NEURAL_SCAFFOLD.protagonistConnectionOpacity,
              focusLensState.internalConnectionDetailWeight,
            )
            : state.isRelated
              ? Math.max(
                PERSISTENT_NEURAL_SCAFFOLD.relatedConnectionOpacity,
                focusLensState.internalConnectionDetailWeight * 0.84,
              )
              : Math.max(
                scaffoldOpacity,
                sampled ? 0.72 : 0,
              )
          : Math.max(
            focusLensState.brainContext.baseConnectionOpacity,
            scaffoldOpacity,
          )
        : state
          ? state.isSelected
            ? state.internalConnectionOpacity
            : sampled ? Math.max(0.025, state.internalConnectionOpacity) : 0.008
          : 0.012;
      opacities[connectionIndex * 2] = opacity;
      opacities[connectionIndex * 2 + 1] = opacity;
    }
  });
  for (let vertexIndex = 0; vertexIndex < buffers.ribbonOpacities.length; vertexIndex += 1) {
    const routeIndex = buffers.ribbonRouteIndices[vertexIndex];
    buffers.ribbonOpacities[vertexIndex] = routeIndex >= 0
      ? focusLensState.enabled
        ? Math.max(
          focusLensConfig.brainContext.minimumDistantConnectionOpacity,
          runtime.routeStates[routeIndex].detailOpacity,
        )
        : runtime.routeStates[routeIndex].detailOpacity
      : focusLensState.enabled
        ? focusLensState.brainContext.baseConnectionOpacity
        : 0.015;
  }
};
