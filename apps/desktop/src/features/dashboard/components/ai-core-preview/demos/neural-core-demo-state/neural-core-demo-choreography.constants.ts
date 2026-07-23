import type {
  NeuralCoreChoreography,
  NeuralCoreChoreographyEnvelope,
  NeuralCoreChoreographyPhase,
  NeuralCoreChoreographyTarget,
} from "../../domain/choreography/neural-core-choreography.types";
import type { NeuralCoreDemoScenario } from "./neural-core-demo-state.types";

const cluster = (id: string): NeuralCoreChoreographyTarget => ({ type: "cluster", id });
const synapse = (id: string): NeuralCoreChoreographyTarget => ({
  type: "synapse",
  id: `synapse:${id}`,
});
const pathway = (id: string): NeuralCoreChoreographyTarget => ({
  type: "pathway",
  id,
});
const globalTarget: NeuralCoreChoreographyTarget = { type: "global" };

const envelope = (
  attackSeconds: number,
  holdSeconds: number,
  releaseSeconds: number,
): NeuralCoreChoreographyEnvelope => ({
  attackSeconds,
  holdSeconds,
  releaseSeconds,
});

const phase = (value: NeuralCoreChoreographyPhase): NeuralCoreChoreographyPhase => value;

export const NEURAL_CORE_DEMO_CHOREOGRAPHIES: Record<
  Exclude<NeuralCoreDemoScenario, "none">,
  NeuralCoreChoreography
> = {
  "data-flow": {
    id: "demo:data-flow",
    durationSeconds: 6.8,
    loop: true,
    phases: [
      phase({
        id: "data-input-receives",
        startSeconds: 0,
        durationSeconds: 1.35,
        envelope: envelope(0.3, 0.45, 0.6),
        targets: [cluster("data-input")],
        effects: { cluster: { activity: 0.9, fillIntensity: 0.42, pulseAmplitude: 0.48 } },
      }),
      phase({
        id: "data-ingest-route",
        startSeconds: 0.55,
        durationSeconds: 1.9,
        envelope: envelope(0.35, 0.75, 0.8),
        targets: [synapse("data-ingest")],
        effects: { synapse: { activity: 1, emphasis: 0.9, conductivity: 1, pulseIntensity: 1 } },
      }),
      phase({
        id: "data-buffer-reacts",
        startSeconds: 1.55,
        durationSeconds: 1.65,
        envelope: envelope(0.35, 0.55, 0.75),
        targets: [cluster("data-buffer")],
        effects: { cluster: { activity: 0.94, fillIntensity: 0.5, pulseAmplitude: 0.52 } },
      }),
      phase({
        id: "data-emit-route",
        startSeconds: 2.35,
        durationSeconds: 2.05,
        envelope: envelope(0.4, 0.8, 0.85),
        targets: [synapse("data-emit")],
        effects: { synapse: { activity: 1, emphasis: 0.94, conductivity: 1, pulseIntensity: 1 } },
      }),
      phase({
        id: "data-output-reacts",
        startSeconds: 3.65,
        durationSeconds: 1.85,
        envelope: envelope(0.35, 0.65, 0.85),
        targets: [cluster("data-output")],
        effects: { cluster: { activity: 0.96, fillIntensity: 0.55, synchronization: 0.3 } },
      }),
    ],
  },
  "function-execution": {
    id: "demo:function-execution",
    durationSeconds: 7.8,
    loop: true,
    phases: [
      phase({
        id: "function-input-arrives",
        startSeconds: 0.55,
        durationSeconds: 1.65,
        envelope: envelope(0.3, 0.65, 0.7),
        targets: [cluster("function-input")],
        effects: { cluster: { activity: 0.8, fillIntensity: 0.46 } },
      }),
      phase({
        id: "function-call-route",
        startSeconds: 1.25,
        durationSeconds: 1.35,
        envelope: envelope(0.28, 0.45, 0.62),
        targets: [synapse("function-call")],
        effects: {
          synapse: {
            activity: 1,
            emphasis: 0.94,
            thickness: 0.52,
            conductivity: 0.9,
            pulseIntensity: 1,
            colorInfluence: 0.74,
          },
        },
      }),
      phase({
        id: "function-core-focus",
        startSeconds: 2.15,
        durationSeconds: 2.8,
        envelope: envelope(0.42, 1.65, 0.73),
        targets: [cluster("function-core")],
        effects: {
          cluster: {
            activity: 0.84,
            density: 0.42,
            fillIntensity: 0.62,
            internalConnectivity: 0.58,
            colorInfluence: 0.72,
          },
        },
      }),
      ...[
        ["function-burst-a", 2.5, 0.82],
        ["function-burst-b", 3.12, 0.96],
        ["function-burst-c", 3.76, 0.88],
      ].map(([id, startSeconds, intensity]) => phase({
        id: String(id),
        startSeconds: Number(startSeconds),
        durationSeconds: 0.6,
        envelope: envelope(0.14, 0.18, 0.28),
        blendMode: "additive",
        targets: [cluster("function-core")],
        effects: {
          cluster: {
            activity: Number(intensity),
            internalConnectivity: Number(intensity),
            fillIntensity: Number(intensity) * 0.8,
            pulseFrequency: 0.82,
            pulseAmplitude: Number(intensity),
          },
        },
      })),
      phase({
        id: "function-result-route",
        startSeconds: 4.35,
        durationSeconds: 1.35,
        envelope: envelope(0.28, 0.45, 0.62),
        targets: [synapse("function-result")],
        effects: {
          synapse: {
            activity: 1,
            emphasis: 1,
            thickness: 0.5,
            conductivity: 1,
            pulseIntensity: 1,
            colorInfluence: 0.68,
          },
        },
      }),
      phase({
        id: "function-output-reacts",
        startSeconds: 5.12,
        durationSeconds: 1.45,
        envelope: envelope(0.3, 0.5, 0.65),
        targets: [cluster("function-output")],
        effects: {
          cluster: {
            activity: 0.94,
            fillIntensity: 0.64,
            synchronization: 0.38,
            colorInfluence: 0.55,
          },
        },
      }),
      phase({
        id: "function-recovery",
        startSeconds: 4.65,
        durationSeconds: 1.4,
        envelope: envelope(0.7, 0, 0.7),
        blendMode: "replace",
        targets: [cluster("function-core")],
        effects: {
          cluster: {
            activity: 0,
            internalConnectivity: 0,
            fillIntensity: 0,
            pulseAmplitude: 0,
            colorInfluence: 0,
          },
        },
      }),
    ],
  },
  "memory-sync": {
    id: "demo:memory-sync",
    durationSeconds: 11.5,
    loop: true,
    phases: [
      phase({
        id: "memory-read-arrives",
        startSeconds: 0.65,
        durationSeconds: 2.15,
        envelope: envelope(0.4, 0.85, 0.9),
        targets: [cluster("memory-process"), synapse("memory-link")],
        effects: {
          cluster: { activity: 0.7, fillIntensity: 0.32 },
          synapse: {
            activity: 0.92,
            emphasis: 0.84,
            thickness: 0.48,
            conductivity: 0.72,
            pulseIntensity: 0.92,
            colorInfluence: 0.72,
          },
        },
      }),
      phase({
        id: "memory-store-persists",
        startSeconds: 1.9,
        durationSeconds: 6.25,
        envelope: envelope(0.7, 4.45, 1.1),
        targets: [cluster("memory-store")],
        effects: {
          cluster: {
            activity: 0.94,
            density: 1,
            cohesion: 0.94,
            internalConnectivity: 0.88,
            persistence: 1,
            fillIntensity: 0.94,
            pulseFrequency: 0.62,
            pulseAmplitude: 0.58,
            colorInfluence: 1,
          },
        },
      }),
      ...[
        ["memory-burst-a", 2.9],
        ["memory-burst-b", 4.45],
        ["memory-burst-c", 6.05],
      ].map(([id, startSeconds]) => phase({
        id: String(id),
        startSeconds: Number(startSeconds),
        durationSeconds: 1.05,
        envelope: envelope(0.25, 0.35, 0.45),
        blendMode: "additive",
        targets: [cluster("memory-store")],
        effects: {
          cluster: {
            internalConnectivity: 0.42,
            density: 0.2,
            synchronization: 0.48,
            pulseAmplitude: 0.52,
          },
        },
      })),
      phase({
        id: "memory-commit-route",
        startSeconds: 6.8,
        durationSeconds: 1.55,
        envelope: envelope(0.35, 0.55, 0.65),
        targets: [synapse("memory-commit")],
        effects: {
          synapse: {
            activity: 1,
            emphasis: 0.94,
            thickness: 0.76,
            conductivity: 0.88,
            persistence: 0.8,
            pulseIntensity: 0.9,
            colorInfluence: 0.94,
          },
        },
      }),
      phase({
        id: "memory-sync-reacts",
        startSeconds: 7.75,
        durationSeconds: 1.65,
        envelope: envelope(0.35, 0.6, 0.7),
        targets: [cluster("memory-sync")],
        effects: {
          cluster: {
            activity: 0.82,
            synchronization: 0.9,
            cohesion: 0.82,
            persistence: 0.72,
            fillIntensity: 0.58,
            colorInfluence: 0.78,
          },
        },
      }),
      phase({
        id: "memory-recovery",
        startSeconds: 9,
        durationSeconds: 1.3,
        envelope: envelope(0.65, 0, 0.65),
        blendMode: "replace",
        targets: [cluster("memory-store"), synapse("memory-link"), synapse("memory-commit")],
        effects: {
          cluster: {
            activity: 0,
            density: 0,
            internalConnectivity: 0,
            persistence: 0,
            fillIntensity: 0,
            colorInfluence: 0,
          },
          synapse: {
            activity: 0,
            emphasis: 0,
            thickness: 0,
            persistence: 0,
            pulseIntensity: 0,
            colorInfluence: 0,
          },
        },
      }),
    ],
  },
  "process-pipeline": {
    id: "demo:process-pipeline",
    durationSeconds: 11.5,
    loop: true,
    phases: [
      ...[
        ["pipeline-input", 0.5],
        ["pipeline-data", 1.5],
        ["pipeline-function", 2.5],
        ["pipeline-process", 3.5],
        ["pipeline-memory", 4.5],
        ["pipeline-decision", 5.5],
        ["pipeline-output", 6.5],
      ].map(([id, startSeconds], index) => phase({
        id: `pipeline-stage-${index}`,
        startSeconds: Number(startSeconds),
        durationSeconds: 1.2,
        envelope: envelope(0.25, 0.35, 0.6),
        targets: [cluster(String(id))],
        effects: {
          cluster: {
            activity: 0.96,
            fillIntensity: 0.64,
            density: 0.22,
            pulseAmplitude: 0.62,
            colorInfluence: 0.66,
          },
        },
      })),
      ...[
        ["pipeline-ingest", 1.15],
        ["pipeline-transfer", 2.15],
        ["pipeline-execute", 3.15],
        ["pipeline-store", 4.15],
        ["pipeline-resolve", 5.15],
        ["pipeline-emit", 6.15],
      ].map(([id, startSeconds], index) => phase({
        id: `pipeline-route-${index}`,
        startSeconds: Number(startSeconds),
        durationSeconds: 1.1,
        envelope: envelope(0.24, 0.3, 0.56),
        targets: [synapse(String(id))],
        effects: {
          synapse: {
            activity: 1,
            emphasis: 0.94,
            thickness: 0.42,
            conductivity: 1,
            pulseIntensity: 1,
            colorInfluence: 0.62,
          },
        },
      })),
      phase({
        id: "pipeline-completes",
        startSeconds: 7.65,
        durationSeconds: 1.7,
        envelope: envelope(0.4, 0.55, 0.75),
        targets: [pathway("pipeline-pathway")],
        effects: { pathway: { activity: 1, sequentialEmphasis: 1, completion: 1 } },
      }),
    ],
  },
  "warning-state": {
    id: "demo:warning-state",
    durationSeconds: 9.5,
    loop: true,
    phases: [
      phase({
        id: "warning-operates-normally",
        startSeconds: 0,
        durationSeconds: 2.4,
        envelope: envelope(0.4, 1.15, 0.85),
        targets: [cluster("warning-input"), synapse("warning-route")],
        effects: {
          cluster: { activity: 0.78, fillIntensity: 0.38 },
          synapse: { activity: 0.82, emphasis: 0.72, pulseIntensity: 0.76 },
        },
      }),
      phase({
        id: "warning-service-delays",
        startSeconds: 1.25,
        durationSeconds: 5.75,
        envelope: envelope(0.85, 3.55, 1.35),
        targets: [cluster("warning-service")],
        effects: {
          cluster: {
            activity: 0.72,
            instability: 0.48,
            jitter: 0.04,
            fragmentation: 0.02,
            fillIntensity: 0.5,
            pulseFrequency: 0.72,
            pulseAmplitude: 0.58,
            colorInfluence: 1,
          },
        },
      }),
      phase({
        id: "warning-route-intermittent",
        startSeconds: 1.75,
        durationSeconds: 5.25,
        envelope: envelope(0.75, 3.15, 1.35),
        targets: [synapse("warning-output-route")],
        effects: {
          synapse: {
            activity: 0.68,
            emphasis: 0.62,
            instability: 0.5,
            fragmentation: 0.08,
            interruption: 0.36,
            pulseFrequency: 0.72,
            pulseIntensity: 0.58,
            colorInfluence: 1,
          },
        },
      }),
      phase({
        id: "warning-output-partial",
        startSeconds: 3.3,
        durationSeconds: 2.55,
        envelope: envelope(0.55, 0.9, 1.1),
        targets: [cluster("warning-output")],
        effects: {
          cluster: {
            activity: 0.58,
            fillIntensity: 0.34,
            colorInfluence: 0.72,
          },
        },
      }),
      phase({
        id: "warning-recovers",
        startSeconds: 5.65,
        durationSeconds: 1.7,
        envelope: envelope(0.85, 0.5, 0.35),
        blendMode: "replace",
        targets: [cluster("warning-service"), synapse("warning-output-route")],
        effects: {
          cluster: {
            activity: 0.4,
            instability: 0,
            jitter: 0,
            fragmentation: 0,
            fillIntensity: 0.25,
            colorInfluence: 0,
          },
          synapse: {
            activity: 0.45,
            instability: 0,
            fragmentation: 0,
            interruption: 0,
            pulseIntensity: 0.32,
            colorInfluence: 0,
          },
        },
      }),
    ],
  },
  "error-state": {
    id: "demo:error-state",
    durationSeconds: 8.8,
    loop: false,
    phases: [
      phase({
        id: "error-operates-initially",
        startSeconds: 0,
        durationSeconds: 2.45,
        envelope: envelope(0.4, 1.25, 0.8),
        targets: [cluster("error-input"), synapse("error-route")],
        effects: {
          cluster: { activity: 0.8, fillIntensity: 0.42 },
          synapse: { activity: 0.86, emphasis: 0.76, pulseIntensity: 0.8 },
        },
      }),
      phase({
        id: "error-route-loses-continuity",
        startSeconds: 1.55,
        durationSeconds: 7.25,
        envelope: envelope(0.95, 6.1, 0.2),
        targets: [synapse("error-output-route")],
        effects: {
          synapse: {
            activity: 0.56,
            emphasis: 0.58,
            instability: 0.58,
            fragmentation: 0.5,
            interruption: 0.55,
            pulseFrequency: 0.48,
            pulseIntensity: 0.48,
            colorInfluence: 1,
          },
        },
      }),
      phase({
        id: "error-service-degrades",
        startSeconds: 2.25,
        durationSeconds: 6.55,
        envelope: envelope(0.95, 5.4, 0.2),
        targets: [cluster("error-service")],
        effects: {
          cluster: {
            activity: 0.62,
            density: 0.4,
            cohesion: 0.16,
            internalConnectivity: 0.22,
            instability: 0.72,
            jitter: 0,
            fragmentation: 0.28,
            nodeDecay: 0.65,
            fillIntensity: 0.65,
            colorInfluence: 1,
          },
        },
      }),
    ],
    terminalEffects: {
      transitionSeconds: 2.8,
      layers: [
        {
          blendMode: "replace",
          targets: [cluster("error-service")],
          effects: {
            cluster: {
              activity: 0.42,
              density: 0.35,
              cohesion: 0.12,
              internalConnectivity: 0.24,
              instability: 0.68,
              jitter: 0,
              fragmentation: 0.28,
              nodeDecay: 0.68,
              fillIntensity: 0.58,
              pulseAmplitude: 0.12,
              colorInfluence: 1,
            },
          },
        },
        {
          blendMode: "replace",
          targets: [synapse("error-output-route")],
          effects: {
            synapse: {
              activity: 0.5,
              emphasis: 0.48,
              instability: 0.52,
              fragmentation: 0.58,
              interruption: 0.6,
              pulseIntensity: 0.14,
              colorInfluence: 1,
            },
          },
        },
      ],
    },
  },
  "success-state": {
    id: "demo:success-state",
    durationSeconds: 8,
    loop: false,
    phases: [
      phase({
        id: "success-pathway-completes",
        startSeconds: 0,
        durationSeconds: 3,
        envelope: envelope(0.5, 1.4, 1.1),
        targets: [
          pathway("success-pathway"),
          synapse("success-resolve"),
          synapse("success-emit"),
        ],
        effects: {
          pathway: { activity: 1, sequentialEmphasis: 0.9, completion: 1 },
          synapse: {
            activity: 0.94,
            emphasis: 0.9,
            thickness: 0.42,
            pulseIntensity: 0.92,
            colorInfluence: 0.58,
          },
        },
      }),
      phase({
        id: "success-confirmation-wave",
        startSeconds: 1.25,
        durationSeconds: 6.75,
        envelope: envelope(0.7, 5.85, 0.2),
        targets: [globalTarget],
        effects: {
          global: {
            activity: 0.48,
            synchronization: 0.72,
            stability: 0.84,
            colorInfluence: 0.18,
          },
        },
      }),
      phase({
        id: "success-clusters-synchronize",
        startSeconds: 2.35,
        durationSeconds: 5.65,
        envelope: envelope(0.85, 4.6, 0.2),
        targets: [cluster("success-decision"), cluster("success-output")],
        effects: {
          cluster: {
            activity: 0.82,
            cohesion: 0.92,
            synchronization: 0.9,
            persistence: 0.78,
            fillIntensity: 0.72,
            pulseFrequency: 0.48,
            pulseAmplitude: 0.36,
            colorInfluence: 0.82,
          },
        },
      }),
    ],
    terminalEffects: {
      transitionSeconds: 2.7,
      layers: [
        {
          blendMode: "replace",
          targets: [cluster("success-decision"), cluster("success-output")],
          effects: {
            cluster: {
              activity: 0.65,
              cohesion: 0.9,
              synchronization: 0.82,
              persistence: 0.75,
              fillIntensity: 0.62,
              pulseFrequency: 0.4,
              pulseAmplitude: 0.28,
              colorInfluence: 0.72,
            },
          },
        },
        {
          blendMode: "replace",
          targets: [globalTarget],
          effects: {
            global: {
              activity: 0.3,
              synchronization: 0.62,
              stability: 0.9,
              colorInfluence: 0.08,
            },
          },
        },
      ],
    },
  },
};
