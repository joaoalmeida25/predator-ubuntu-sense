import type {
  NeuralCoreAggregatedRoute,
} from "../../../visualization/cluster-grammar/neural-core-cluster-grammar.types";
import type {
  NeuralCoreOperationalRouteVisualChannel,
  NeuralCoreOperationalRouteVisualMode,
  NeuralCoreOperationalRouteVisualStatus,
} from "../../../visualization/cluster-grammar/neural-core-operational-route-visual-channel.types";
import type {
  NeuralCoreOperationalRouteVisualRequest,
} from "./neural-core-operational-propagation.mapper";

export interface MapOperationalRouteEventToVisualChannelParams {
  request: NeuralCoreOperationalRouteVisualRequest;
  aggregatedRoutes: readonly NeuralCoreAggregatedRoute[];
  routeIndexBySynapseId: Readonly<Record<string, number>>;
  visualMode: NeuralCoreOperationalRouteVisualMode;
}

const mapRouteVisualStatus = (
  request: NeuralCoreOperationalRouteVisualRequest,
): NeuralCoreOperationalRouteVisualStatus => request.event.status === "idle"
  ? "processing"
  : request.event.status;

const hasFiniteControlPoints = (
  route: NeuralCoreAggregatedRoute,
): boolean => route.controlPoints.length >= 2
  && route.controlPoints.every((point) => (
    point.length === 3
    && Number.isFinite(point[0])
    && Number.isFinite(point[1])
    && Number.isFinite(point[2])
  ));

export const mapOperationalRouteEventToVisualChannel = ({
  request,
  aggregatedRoutes,
  routeIndexBySynapseId,
  visualMode,
}: MapOperationalRouteEventToVisualChannelParams): NeuralCoreOperationalRouteVisualChannel
| undefined => {
  if (visualMode !== "aggregated") {
    return undefined;
  }
  const routeIndex = routeIndexBySynapseId[request.routeId];
  const aggregatedRoute = routeIndex === undefined
    ? undefined
    : aggregatedRoutes[routeIndex];
  if (
    !aggregatedRoute
    || aggregatedRoute.synapseIds.indexOf(request.routeId) < 0
    || !hasFiniteControlPoints(aggregatedRoute)
  ) {
    return undefined;
  }
  const usesForwardGeometry = aggregatedRoute.sourceClusterId === request.sourceClusterId
    && aggregatedRoute.targetClusterId === request.targetClusterId;
  const usesBackwardGeometry = aggregatedRoute.sourceClusterId === request.targetClusterId
    && aggregatedRoute.targetClusterId === request.sourceClusterId;
  if (!usesForwardGeometry && !usesBackwardGeometry) {
    return undefined;
  }
  const geometryId = aggregatedRoute.id;
  const channelId = [
    request.executionId,
    request.eventId,
    request.routeId,
    geometryId,
  ].join(":");
  return Object.freeze({
    id: channelId,
    executionId: request.executionId,
    eventId: request.eventId,
    routeId: request.routeId,
    mode: "aggregated",
    sourceClusterId: request.sourceClusterId,
    targetClusterId: request.targetClusterId,
    direction: usesForwardGeometry ? "forward" : "backward",
    geometryId,
    controlPoints: aggregatedRoute.controlPoints,
    relatedSynapseIds: aggregatedRoute.synapseIds,
    relatedPathwayIds: aggregatedRoute.pathwayIds,
    status: mapRouteVisualStatus(request),
  });
};
