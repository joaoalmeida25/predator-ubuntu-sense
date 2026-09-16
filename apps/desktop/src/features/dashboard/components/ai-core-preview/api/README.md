# Neural Core Public API

## Purpose

`NeuralCore` receives a semantic description of a system and turns it into an interactive neural visualization. The consumer supplies data and semantics; Neural Core owns normalization, topology, spatial layout, and rendering.

## Minimal integration

```tsx
import { NeuralCore, type NeuralCoreModelInput } from "./index";

const model: NeuralCoreModelInput = {
  id: "system",
  entities: [],
  routes: [],
};

<NeuralCore model={model} />;
```

See [`examples/minimal.example.tsx`](examples/minimal.example.tsx), [`examples/inspection.example.tsx`](examples/inspection.example.tsx), and [`examples/operational.example.tsx`](examples/operational.example.tsx).

## Model

- **Entity:** a component, service, process, or resource.
- **Cluster:** a domain or grouping of related entities.
- **Route:** a directed or bidirectional relationship between entity or cluster endpoints.
- **Pathway:** an ordered operational grouping of routes and clusters.
- **Metadata:** optional consumer-owned extension data. It is not an internal configuration channel.

## Configuration

Pass `NeuralCoreConfigInput` through `config`. Presets provide minimal, presentation, inspection, and operational defaults, while nested settings control presentation, inspection, labels, visualization, and motion preference.

## Interaction

For uncontrolled interaction, provide `defaultInteractionState`. For controlled interaction, provide `interactionState` and `onInteractionStateChange`. Consumer-facing entity and cluster IDs are ordinary strings.

## Runtime

Without `runtime`, Neural Core presents a structural or architectural model. With `NeuralCoreRuntimeInput`, it presents an operational execution with timed events, metrics, impact, retry information, and an outcome.

## Events

Use `onEvent` to observe readiness, interaction changes, runtime events, and execution completion. Every event is represented by the `NeuralCoreEvent` union.

## Errors

Use `onError` to receive `NeuralCorePublicError`. The public error boundary reports input validation and runtime errors.

## Defaults

`DEFAULT_NEURAL_CORE_CONFIG` and `DEFAULT_NEURAL_CORE_INTERACTION_STATE` expose stable defaults. `createNeuralCoreConfig` and `createNeuralCoreInteractionState` resolve partial inputs.

## Examples

- `minimal.example.tsx`: structural model with entity routes.
- `inspection.example.tsx`: controlled selection and inspection events.
- `operational.example.tsx`: runtime events, metrics, outcome, and errors.

## Public vs internal boundary

Public contracts cover the model, configuration, interaction, runtime, events, and errors. Normalization details, adapters, bindings, the runtime engine, topology, spatial maps, renderer, Canvas, shaders, and buffers remain internal.
