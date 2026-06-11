import type { RefObject } from "react";
import type { BufferAttribute, Group } from "three";

import type {
  NeuralCoreConnectionBuffer,
  NeuralCoreNode,
  NeuralCoreParticleField,
  NeuralCorePointCloud,
  NeuralCorePulseField,
  NeuralCoreRing,
} from "../neural-core-scene.types";

export interface NeuralCoreSceneViewProps {
  baseRef: RefObject<Group | null>;
  connectionBuffers: NeuralCoreConnectionBuffer[];
  coreNodes: NeuralCoreNode[];
  coreRef: RefObject<Group | null>;
  hubRef: RefObject<Group | null>;
  hubs: NeuralCoreNode[];
  networkRef: RefObject<Group | null>;
  nodeClouds: NeuralCorePointCloud[];
  particleField: NeuralCoreParticleField;
  particlePositionRef: RefObject<BufferAttribute | null>;
  pulseColorRef: RefObject<BufferAttribute | null>;
  pulseField: NeuralCorePulseField;
  pulsePositionRef: RefObject<BufferAttribute | null>;
  ringRef: RefObject<Group | null>;
  rings: NeuralCoreRing[];
}
