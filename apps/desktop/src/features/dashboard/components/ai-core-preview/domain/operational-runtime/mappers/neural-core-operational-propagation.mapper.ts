import type {
  NeuralCoreSynapse,
  NeuralCoreTransmission,
} from "../../topology/neural-core-topology.types";
import type {
  NeuralCoreOperationalRouteVisualChannel,
} from "../../../visualization/cluster-grammar/neural-core-operational-route-visual-channel.types";
import type { NeuralCoreOperationalEvent } from "../types/neural-core-operational-event.types";
import type {
  NeuralCoreOperationalPresentationEvent,
} from "../runtime/neural-core-operational-presentation.types";

export interface NeuralCoreOperationalRouteVisualRequest {
  id: string;
  executionId: string;
  eventId: string;
  routeId: string;
  sourceClusterId: string;
  targetClusterId: string;
  event: NeuralCoreOperationalEvent;
  route: NeuralCoreSynapse;
  presentationEvent: NeuralCoreOperationalPresentationEvent;
}

export interface NeuralCoreOperationalPropagationInput {
  id: string;
  eventId: string;
  routeId: string;
  sourceClusterId: string;
  targetClusterId: string;
  channel: NeuralCoreOperationalRouteVisualChannel;
  transmission: NeuralCoreTransmission;
}

export interface MapOperationalRouteEventToVisualRequestParams {
  executionId: string;
  event: NeuralCoreOperationalEvent;
  route: NeuralCoreSynapse;
  presentationEvent: NeuralCoreOperationalPresentationEvent;
}

export interface MapOperationalVisualChannelToPropagationParams {
  channel: NeuralCoreOperationalRouteVisualChannel;
  request: NeuralCoreOperationalRouteVisualRequest;
}

const isOperationalRouteVisualEvent = (
  event: NeuralCoreOperationalEvent,
): boolean => event.type === "route-transmission"
  || event.type === "warning-raised"
  || event.type === "failure-raised"
  || event.type === "retry-started";

export const mapOperationalRouteEventToVisualRequest = ({
  executionId,
  event,
  route,
  presentationEvent,
}: MapOperationalRouteEventToVisualRequestParams): NeuralCoreOperationalRouteVisualRequest
| undefined => {
  if (
    !isOperationalRouteVisualEvent(event)
    || presentationEvent.sourceEventId !== event.id
    || !route.id
    || !route.fromClusterId
    || !route.toClusterId
  ) {
    return undefined;
  }
  return {
    id: `${executionId}:${event.id}:${route.id}`,
    executionId,
    eventId: event.id,
    routeId: route.id,
    sourceClusterId: route.fromClusterId,
    targetClusterId: route.toClusterId,
    event,
    route,
    presentationEvent,
  };
};

export const mapOperationalVisualChannelToPropagation = ({
  channel,
  request,
}: MapOperationalVisualChannelToPropagationParams): NeuralCoreOperationalPropagationInput
| undefined => {
  if (
    channel.executionId !== request.executionId
    || channel.eventId !== request.eventId
    || channel.routeId !== request.routeId
    || channel.sourceClusterId !== request.sourceClusterId
    || channel.targetClusterId !== request.targetClusterId
    || channel.controlPoints.length < 2
  ) {
    return undefined;
  }
  const durationSeconds = Math.max(
    0.001,
    request.presentationEvent.presentationDurationMs / 1000,
  );
  const transmissionStatus = channel.status === "recovering"
    ? "warning"
    : channel.status;
  return {
    id: channel.id,
    eventId: channel.eventId,
    routeId: channel.routeId,
    sourceClusterId: channel.sourceClusterId,
    targetClusterId: channel.targetClusterId,
    channel,
    transmission: {
      id: `transmission:${channel.id}`,
      synapseId: channel.routeId,
      kind: "route",
      status: transmissionStatus,
      intensity: 0.94,
      progress: 0,
      speed: 1,
      direction: request.route.fromClusterId === channel.sourceClusterId
        && request.route.toClusterId === channel.targetClusterId
        ? "forward"
        : "backward",
      metadata: {
        operationalEventId: channel.eventId,
        operationalRouteId: channel.routeId,
        operationalVisualChannelId: channel.id,
        operationalGeometryId: channel.geometryId,
        operationalDurationMs: request.event.durationMs ?? 0,
        presentationDurationMs: request.presentationEvent.presentationDurationMs,
        durationSeconds,
      },
    },
  };
};
