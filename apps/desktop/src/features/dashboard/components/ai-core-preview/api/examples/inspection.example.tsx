import { useCallback, useState, type ReactElement } from "react";

import {
  NeuralCore,
  type NeuralCoreEvent,
  type NeuralCoreInteractionState,
  type NeuralCoreInteractionStateChangeHandler,
  type NeuralCoreModelInput,
} from "../index";

const model: NeuralCoreModelInput = {
  id: "inspection-overview",
  entities: [
    {
      id: "request-handler",
      label: "Request handler",
      clusterId: "api",
      kind: "service",
    },
    {
      id: "record-store",
      label: "Record store",
      clusterId: "storage",
      kind: "database",
    },
  ],
  clusters: [
    { id: "api", label: "API", kind: "api" },
    { id: "storage", label: "Storage", kind: "storage" },
  ],
  routes: [
    {
      id: "api-to-storage",
      source: { kind: "entity", entityId: "request-handler" },
      target: { kind: "entity", entityId: "record-store" },
      relation: "data-flow",
    },
  ],
};

export const InspectionNeuralCoreExample = (): ReactElement => {
  const [interactionState, setInteractionState] = useState<NeuralCoreInteractionState>({
    mode: "inspection",
    selectedClusterId: "api",
    paused: false,
  });
  const [lastEventType, setLastEventType] = useState<NeuralCoreEvent["type"]>();
  const handleInteractionStateChange = useCallback<NeuralCoreInteractionStateChangeHandler>(
    (nextState) => setInteractionState(nextState),
    [],
  );
  const handleEvent = useCallback((event: NeuralCoreEvent): void => {
    setLastEventType(event.type);
  }, []);

  return (
    <div>
      <button
        type="button"
        onClick={() => setInteractionState((current) => ({
          ...current,
          selectedClusterId: "storage",
        }))}
      >
        Select storage
      </button>
      <output>{lastEventType}</output>
      <NeuralCore
        model={model}
        config={{
          preset: "inspection",
          inspection: { enabled: true },
        }}
        interactionState={interactionState}
        onInteractionStateChange={handleInteractionStateChange}
        onEvent={handleEvent}
      />
    </div>
  );
};
