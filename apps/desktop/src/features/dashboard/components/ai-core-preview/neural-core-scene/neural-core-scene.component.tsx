import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactElement } from "react";
import type { BufferAttribute, Group } from "three";

import type { NeuralCoreParticle, NeuralCorePulse } from "../neural-core-scene.types";
import { createNeuralCoreGraph } from "../neural-core.utils";
import { NeuralCoreSceneView } from "./neural-core-scene-view.component";

const getPulseRgb = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.replace("#", ""), 16);

  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
};

const animatePulseGroup = (
  group: Group,
  elapsedTime: number,
  intensity: number,
): void => {
  group.children.forEach((child): void => {
    const phase = child.userData.phase;
    const baseScale = child.userData.baseScale;

    if (typeof phase !== "number" || typeof baseScale !== "number") {
      return;
    }

    child.scale.setScalar(baseScale * (1 + Math.sin(elapsedTime * 0.92 + phase) * intensity));
  });
};

const animateRingGroup = (group: Group, elapsedTime: number): void => {
  group.rotation.y = elapsedTime * 0.018;
  group.rotation.x = Math.sin(elapsedTime * 0.12) * 0.035;

  group.children.forEach((child): void => {
    const speed = child.userData.speed;
    const phase = child.userData.phase;

    if (typeof speed !== "number" || typeof phase !== "number") {
      return;
    }

    child.rotation.z = elapsedTime * speed + phase;
  });
};

const updateParticlePositions = (
  attribute: BufferAttribute,
  particles: NeuralCoreParticle[],
  elapsedTime: number,
): void => {
  const positions = attribute.array;

  if (!(positions instanceof Float32Array)) {
    return;
  }

  particles.forEach((particle, index): void => {
    const offset = index * 3;
    const phase = particle.phase + elapsedTime * particle.speed;

    positions[offset] = particle.basePosition[0] + Math.sin(phase) * particle.drift[0];
    positions[offset + 1] = particle.basePosition[1] + Math.cos(phase * 0.77) * particle.drift[1];
    positions[offset + 2] = particle.basePosition[2] + Math.sin(phase * 0.63) * particle.drift[2];
  });

  attribute.needsUpdate = true;
};

const updatePulseAttributes = (
  positionAttribute: BufferAttribute,
  colorAttribute: BufferAttribute,
  pulses: NeuralCorePulse[],
  elapsedTime: number,
): void => {
  const positions = positionAttribute.array;
  const colors = colorAttribute.array;

  if (!(positions instanceof Float32Array) || !(colors instanceof Float32Array)) {
    return;
  }

  pulses.forEach((pulse, index): void => {
    const offset = index * 3;
    const routeProgress = pulse.phase + elapsedTime * pulse.speed;
    const routeIndex = Math.floor(routeProgress) % pulse.routes.length;
    const progress = routeProgress - Math.floor(routeProgress);
    const route = pulse.routes[routeIndex];
    const ease = progress * progress * (3 - 2 * progress);
    const fade = Math.sin(progress * Math.PI);
    const routeCenterBoost = 1 - Math.abs(progress - 0.5) * 2;
    const shimmer = Math.sin((elapsedTime * 2.2 + pulse.phase) * Math.PI) * 0.011;
    const color = getPulseRgb(pulse.color);
    const intensity = 0.18 + Math.pow(fade, 0.72) * 1.82 + routeCenterBoost * 0.12;

    positions[offset] = route.from[0] + (route.to[0] - route.from[0]) * ease + shimmer;
    positions[offset + 1] = route.from[1] + (route.to[1] - route.from[1]) * ease;
    positions[offset + 2] = route.from[2] + (route.to[2] - route.from[2]) * ease - shimmer;

    colors[offset] = color[0] * intensity;
    colors[offset + 1] = color[1] * intensity;
    colors[offset + 2] = color[2] * intensity;
  });

  positionAttribute.needsUpdate = true;
  colorAttribute.needsUpdate = true;
};

export const NeuralCoreScene = (): ReactElement => {
  const baseRef = useRef<Group | null>(null);
  const coreRef = useRef<Group | null>(null);
  const hubRef = useRef<Group | null>(null);
  const networkRef = useRef<Group | null>(null);
  const particlePositionRef = useRef<BufferAttribute | null>(null);
  const pulseColorRef = useRef<BufferAttribute | null>(null);
  const pulsePositionRef = useRef<BufferAttribute | null>(null);
  const ringRef = useRef<Group | null>(null);
  const graph = useMemo(() => createNeuralCoreGraph(), []);

  useFrame(({ clock }): void => {
    const elapsedTime = clock.getElapsedTime();

    if (networkRef.current) {
      networkRef.current.rotation.y = elapsedTime * 0.037;
      networkRef.current.rotation.x = Math.sin(elapsedTime * 0.14) * 0.044;
      networkRef.current.rotation.z = Math.cos(elapsedTime * 0.09) * 0.019;
      networkRef.current.scale.setScalar(0.95 + Math.sin(elapsedTime * 0.31) * 0.004);
    }

    if (baseRef.current) {
      baseRef.current.rotation.y = elapsedTime * 0.035;
      baseRef.current.scale.setScalar(1 + Math.sin(elapsedTime * 0.72) * 0.014);
    }

    if (ringRef.current) {
      animateRingGroup(ringRef.current, elapsedTime);
    }

    if (hubRef.current) {
      animatePulseGroup(hubRef.current, elapsedTime, 0.058);
    }

    if (coreRef.current) {
      animatePulseGroup(coreRef.current, elapsedTime, 0.06);
    }

    if (particlePositionRef.current) {
      updateParticlePositions(particlePositionRef.current, graph.particles, elapsedTime);
    }

    if (pulsePositionRef.current && pulseColorRef.current) {
      updatePulseAttributes(pulsePositionRef.current, pulseColorRef.current, graph.pulses, elapsedTime);
    }
  });

  return (
    <NeuralCoreSceneView
      baseRef={baseRef}
      connectionBuffers={graph.connectionBuffers}
      coreNodes={graph.coreNodes}
      coreRef={coreRef}
      hubRef={hubRef}
      hubs={graph.hubs}
      networkRef={networkRef}
      nodeClouds={graph.nodeClouds}
      particleField={graph.particleField}
      particlePositionRef={particlePositionRef}
      pulseColorRef={pulseColorRef}
      pulseField={graph.pulseField}
      pulsePositionRef={pulsePositionRef}
      ringRef={ringRef}
      rings={graph.rings}
    />
  );
};
