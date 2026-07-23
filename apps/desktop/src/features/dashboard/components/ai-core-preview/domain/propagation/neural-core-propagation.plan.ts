import type {
  NeuralCorePathwayExecutionPlan,
  NeuralCorePathwayStagePlan,
  NeuralCorePropagationPlan,
} from "./neural-core-propagation.types";
import type {
  NeuralCoreTopology,
  NeuralCoreTransmission,
} from "../topology/neural-core-topology.types";
import { normalizeNeuralCoreTopology } from "../topology/neural-core-topology.utils";

const stableSerialize = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "undefined";
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .sort()
    .filter((key) => record[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`);
  return `{${entries.join(",")}}`;
};

export const createNeuralCoreTopologyKey = (topology?: NeuralCoreTopology): string => {
  return stableSerialize(normalizeNeuralCoreTopology(topology));
};

const createPathwayPlan = (
  topology: NeuralCoreTopology,
  synapsesById: ReadonlyMap<string, NeuralCoreTopology["synapses"][number]>,
  transmissionsBySynapseId: ReadonlyMap<string, readonly NeuralCoreTransmission[]>,
  pathwayIndex: number,
): NeuralCorePathwayExecutionPlan => {
  const pathway = topology.pathways?.[pathwayIndex];
  if (!pathway) {
    throw new Error(`Missing pathway at index ${pathwayIndex}`);
  }

  const stages: NeuralCorePathwayStagePlan[] = pathway.synapseIds.map(
    (synapseId, originalStageIndex) => {
      const synapse = synapsesById.get(synapseId);
      const transmissions = transmissionsBySynapseId.get(synapseId) ?? [];
      const transmission = transmissions.find(({ status }) => status !== "disabled")
        ?? transmissions[0];
      return {
        originalStageIndex,
        synapseId,
        transmissionId: transmission?.id,
        runnable: Boolean(
          synapse
          && synapse.status !== "disabled"
          && transmission?.status !== "disabled",
        ),
      };
    },
  );

  return {
    pathway,
    stages,
    runnableStageCount: stages.filter((stage) => stage.runnable).length,
  };
};

export const createNeuralCorePropagationPlan = (
  topology: NeuralCoreTopology,
): NeuralCorePropagationPlan => {
  const normalizedTopology = normalizeNeuralCoreTopology(topology);
  const clustersById = new Map(
    normalizedTopology.clusters.map((cluster) => [cluster.id, cluster]),
  );
  const synapsesById = new Map(
    normalizedTopology.synapses.map((synapse) => [synapse.id, synapse]),
  );
  const transmissionsById = new Map(
    normalizedTopology.transmissions.map((transmission) => [transmission.id, transmission]),
  );
  const mutableTransmissionsBySynapseId = new Map<string, NeuralCoreTransmission[]>();
  for (const transmission of normalizedTopology.transmissions) {
    const transmissions = mutableTransmissionsBySynapseId.get(transmission.synapseId) ?? [];
    transmissions.push(transmission);
    mutableTransmissionsBySynapseId.set(transmission.synapseId, transmissions);
  }
  const transmissionsBySynapseId = new Map<string, readonly NeuralCoreTransmission[]>(
    [...mutableTransmissionsBySynapseId].map(([synapseId, transmissions]) => {
      return [synapseId, transmissions];
    }),
  );
  const pathwayPlans = (normalizedTopology.pathways ?? []).map((_pathway, index) => {
    return createPathwayPlan(
      normalizedTopology,
      synapsesById,
      transmissionsBySynapseId,
      index,
    );
  });

  return {
    topologyKey: createNeuralCoreTopologyKey(normalizedTopology),
    topology: normalizedTopology,
    clustersById,
    synapsesById,
    transmissionsById,
    transmissionsBySynapseId,
    pathwayPlans,
    pathwayPlansById: new Map(pathwayPlans.map((pathwayPlan) => {
      return [pathwayPlan.pathway.id, pathwayPlan];
    })),
  };
};
