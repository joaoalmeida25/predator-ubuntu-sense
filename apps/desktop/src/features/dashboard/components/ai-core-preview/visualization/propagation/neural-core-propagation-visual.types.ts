export interface NeuralCoreClusterVisualActivation {
  clusterId: string;
  intensity: number;
  opacity: number;
  size: number;
  color: string;
}

export interface NeuralCoreSynapseVisualActivation {
  synapseId: string;
  opacity: number;
  color: string;
}

export interface NeuralCorePropagationVisualPulse {
  synapseId: string;
  progress: number;
  intensity: number;
  opacity: number;
  size: number;
  trailLength: number;
  color: string;
  direction: "forward" | "backward";
}

export interface NeuralCorePathwayVisualActivation {
  synapseIds: string[];
  progress: number;
  intensity: number;
}

export interface NeuralCorePropagationVisualState {
  clusterActivations: NeuralCoreClusterVisualActivation[];
  synapseActivations: NeuralCoreSynapseVisualActivation[];
  pulses: NeuralCorePropagationVisualPulse[];
  pathwayHighlights: NeuralCorePathwayVisualActivation[];
}
