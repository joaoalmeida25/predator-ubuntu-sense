export type NeuralCoreVector3 = [number, number, number];
export type NeuralCoreNodeKind = "micro" | "standard" | "hub" | "core";
export type NeuralCoreConnectionBucket = "low" | "medium" | "high" | "hub";
export type NeuralCorePointCloudKind = "micro" | "standard" | "outer";

export interface NeuralCoreNode {
  baseScale: number;
  color: string;
  id: number;
  intensity: number;
  isOuter: boolean;
  kind: NeuralCoreNodeKind;
  phase: number;
  position: NeuralCoreVector3;
  radius: number;
}

export interface NeuralCoreConnection {
  bucket: NeuralCoreConnectionBucket;
  from: NeuralCoreVector3;
  id: string;
  opacity: number;
  strength: number;
  to: NeuralCoreVector3;
}

export interface NeuralCoreConnectionBuffer {
  bucket: NeuralCoreConnectionBucket;
  color: string;
  opacity: number;
  positions: Float32Array;
}

export interface NeuralCorePointCloud {
  colors: Float32Array;
  kind: NeuralCorePointCloudKind;
  opacity: number;
  positions: Float32Array;
  size: number;
}

export interface NeuralCoreParticle {
  basePosition: NeuralCoreVector3;
  drift: NeuralCoreVector3;
  id: number;
  phase: number;
  speed: number;
}

export interface NeuralCoreParticleField {
  colors: Float32Array;
  opacity: number;
  positions: Float32Array;
  size: number;
}

export interface NeuralCorePulseRoute {
  from: NeuralCoreVector3;
  to: NeuralCoreVector3;
}

export interface NeuralCorePulse {
  color: string;
  id: number;
  phase: number;
  routes: NeuralCorePulseRoute[];
  speed: number;
}

export interface NeuralCorePulseField {
  colors: Float32Array;
  opacity: number;
  positions: Float32Array;
  size: number;
}

export interface NeuralCoreRing {
  color: string;
  id: number;
  opacity: number;
  phase: number;
  radius: number;
  rotation: NeuralCoreVector3;
  speed: number;
  tubeRadius: number;
}

export interface NeuralCoreGraph {
  connectionBuffers: NeuralCoreConnectionBuffer[];
  connections: NeuralCoreConnection[];
  coreNodes: NeuralCoreNode[];
  hubs: NeuralCoreNode[];
  nodeClouds: NeuralCorePointCloud[];
  nodes: NeuralCoreNode[];
  particleField: NeuralCoreParticleField;
  particles: NeuralCoreParticle[];
  pulseField: NeuralCorePulseField;
  pulses: NeuralCorePulse[];
  rings: NeuralCoreRing[];
}
