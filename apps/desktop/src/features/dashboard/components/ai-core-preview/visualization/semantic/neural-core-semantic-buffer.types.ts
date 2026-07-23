export interface NeuralCoreSemanticNodeTargets {
  brightnesses: Float32Array;
  colorInfluences: Float32Array;
  colors: Float32Array;
  decays: Float32Array;
  fills: Float32Array;
  fragmentations: Float32Array;
  jitters: Float32Array;
  opacities: Float32Array;
  pulseAmplitudes: Float32Array;
  pulseFrequencies: Float32Array;
  scales: Float32Array;
  synchronizations: Float32Array;
}

export interface NeuralCoreSemanticNodeField {
  brightnesses: Float32Array;
  colorInfluences: Float32Array;
  colors: Float32Array;
  decays: Float32Array;
  fills: Float32Array;
  fragmentations: Float32Array;
  jitters: Float32Array;
  maximumPointCount: number;
  opacities: Float32Array;
  pulseAmplitudes: Float32Array;
  pulseFrequencies: Float32Array;
  scales: Float32Array;
  seeds: Float32Array;
  synchronizations: Float32Array;
  targets: NeuralCoreSemanticNodeTargets;
}

export interface NeuralCoreSemanticPointCloudField {
  brightnesses: Float32Array;
  colorInfluences: Float32Array;
  colors: Float32Array;
  decays: Float32Array;
  fills: Float32Array;
  fragmentations: Float32Array;
  jitters: Float32Array;
  opacities: Float32Array;
  pulseAmplitudes: Float32Array;
  pulseFrequencies: Float32Array;
  scales: Float32Array;
  seeds: Float32Array;
  synchronizations: Float32Array;
}

export interface NeuralCoreSemanticConnectionField {
  baseColors: Float32Array;
  baseOpacities: Float32Array;
  clusterEffectIndicesByConnection: readonly (readonly number[])[];
  colors: Float32Array;
  opacities: Float32Array;
  semanticConnectionIndices: readonly number[];
  targetColors: Float32Array;
  targetOpacities: Float32Array;
}

export type NeuralCoreSemanticRibbonKind = "synapse";

export interface NeuralCoreSemanticRibbonPathwayContribution {
  effectIndex: number;
  routeCount: number;
  routeIndex: number;
}

export interface NeuralCoreSemanticRibbonSpan {
  baseOpacity: number;
  kind: NeuralCoreSemanticRibbonKind;
  pathwayContributions: readonly NeuralCoreSemanticRibbonPathwayContribution[];
  releasing: boolean;
  routeSeed: number;
  segmentCount: number;
  segmentIndex: number;
  semanticId: string;
  startVertexIndex: number;
  synapseEffectIndex: number;
  vertexCount: number;
}

export interface NeuralCoreSemanticRibbonTargets {
  colors: Float32Array;
  fragmentations: Float32Array;
  instabilities: Float32Array;
  interruptions: Float32Array;
  opacities: Float32Array;
  pulseFrequencies: Float32Array;
  pulseIntensities: Float32Array;
  thicknesses: Float32Array;
}

export interface NeuralCoreSemanticRibbonField {
  colors: Float32Array;
  fragmentations: Float32Array;
  instabilities: Float32Array;
  interruptions: Float32Array;
  opacities: Float32Array;
  otherPositions: Float32Array;
  positions: Float32Array;
  routeProgresses: Float32Array;
  routeSeeds: Float32Array;
  sides: Float32Array;
  spans: readonly NeuralCoreSemanticRibbonSpan[];
  targets: NeuralCoreSemanticRibbonTargets;
  pulseFrequencies: Float32Array;
  pulseIntensities: Float32Array;
  thicknesses: Float32Array;
}

export interface NeuralCoreSemanticBufferState {
  clusterEffectIndexById: Readonly<Record<string, number>>;
  connectionFields: readonly NeuralCoreSemanticConnectionField[];
  directionClusterLevels: Uint8Array;
  directionSynapseLevels: Uint8Array;
  nodeBufferIndexById: Int32Array;
  nodeField: NeuralCoreSemanticNodeField;
  nodeFocusLevels: Uint8Array;
  nodeMembershipEffectIndices: readonly (readonly number[])[];
  pointCloudFields: readonly NeuralCoreSemanticPointCloudField[];
  ribbonField: NeuralCoreSemanticRibbonField;
  synapseEffectIndexById: Readonly<Record<string, number>>;
}

export interface NeuralCoreSemanticBufferUpdateResult {
  activeNodeCount: number;
  activeRibbonVertexCount: number;
  connectionAttributesChanged: boolean;
  nodeAttributesChanged: boolean;
  ribbonAttributesChanged: boolean;
}
