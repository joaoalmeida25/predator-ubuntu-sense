import type {
  NeuralCoreConnection,
  NeuralCoreConnectionBucket,
  NeuralCoreConnectionBuffer,
  NeuralCoreGraph,
  NeuralCoreNode,
  NeuralCoreNodeKind,
  NeuralCoreParticle,
  NeuralCoreParticleField,
  NeuralCorePointCloud,
  NeuralCorePointCloudKind,
  NeuralCorePulse,
  NeuralCorePulseField,
  NeuralCorePulseRoute,
  NeuralCoreRing,
  NeuralCoreVector3,
} from "./neural-core-scene.types";

const NEURAL_NODE_COUNT = 640;
const AMBIENT_PARTICLE_COUNT = 300;
const ACTIVE_PULSE_COUNT = 76;
const MAX_CONNECTIONS_PER_MICRO_NODE = 6;
const MAX_CONNECTIONS_PER_STANDARD_NODE = 8;
const MAX_CONNECTIONS_PER_HUB_NODE = 13;
const CONNECTION_THRESHOLD = 0.55;
const HUB_CONNECTION_THRESHOLD = 1.38;
const CORE_POSITION: NeuralCoreVector3 = [0.04, -0.08, 0.02];

interface SeededRandom {
  next: () => number;
}

interface BrainCandidate {
  centerStrength: number;
  edgeStrength: number;
  position: NeuralCoreVector3;
  stemStrength: number;
}

const createSeededRandom = (seed: number): SeededRandom => {
  let state = seed >>> 0;

  return {
    next: (): number => {
      state = (1664525 * state + 1013904223) >>> 0;
      return state / 4294967296;
    },
  };
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const getDistance = (from: NeuralCoreVector3, to: NeuralCoreVector3): number => {
  const deltaX = from[0] - to[0];
  const deltaY = from[1] - to[1];
  const deltaZ = from[2] - to[2];

  return Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
};

const getEllipsoidValue = (
  position: NeuralCoreVector3,
  center: NeuralCoreVector3,
  radius: NeuralCoreVector3,
): number => {
  const x = (position[0] - center[0]) / radius[0];
  const y = (position[1] - center[1]) / radius[1];
  const z = (position[2] - center[2]) / radius[2];

  return x * x + y * y + z * z;
};

const getOrganicJitter = (x: number, y: number, z: number): NeuralCoreVector3 => {
  return [
    Math.sin(y * 4.1 + z * 2.2) * 0.045 + Math.cos(z * 3.7) * 0.025,
    Math.sin(x * 3.6 + z * 2.8) * 0.04,
    Math.cos(x * 2.9 + y * 3.4) * 0.055,
  ];
};

const getBrainCandidate = (random: SeededRandom): BrainCandidate | null => {
  const rawX = (random.next() * 2 - 1) * 2.2;
  const rawY = (random.next() * 2 - 1) * 1.38;
  const rawZ = (random.next() * 2 - 1) * 1.18;
  const jitter = getOrganicJitter(rawX, rawY, rawZ);
  const asymmetry = Math.sin(rawX * 2.1 + rawZ * 1.8) * 0.075 + Math.cos(rawY * 3.2) * 0.035;
  const position: NeuralCoreVector3 = [rawX + jitter[0] + asymmetry, rawY + jitter[1], rawZ + jitter[2]];
  const leftLobe = getEllipsoidValue(position, [-0.58, 0.12, 0.02], [1.3, 1.04, 0.92]);
  const rightLobe = getEllipsoidValue(position, [0.62, 0.08, -0.04], [1.36, 1, 0.94]);
  const bridge = getEllipsoidValue(position, [0.02, 0.02, 0], [1.02, 0.86, 0.84]);
  const lowerStem = getEllipsoidValue(position, [0.16, -0.94, 0.02], [0.44, 0.58, 0.36]);
  const silhouette = Math.min(leftLobe, rightLobe, bridge, lowerStem);

  if (silhouette > 1) {
    return null;
  }

  const centerStrength = 1 - clamp(bridge, 0, 1);
  const edgeStrength = clamp(silhouette, 0, 1);
  const stemStrength = 1 - clamp(lowerStem, 0, 1);
  const corticalBias = edgeStrength > 0.64 ? 0.22 : 0;
  const acceptance = 0.34 + centerStrength * 0.5 + edgeStrength * 0.2 + stemStrength * 0.2 + corticalBias;

  if (random.next() > acceptance) {
    return null;
  }

  return {
    position,
    centerStrength,
    edgeStrength,
    stemStrength,
  };
};

const getNodeKind = (index: number, candidate: BrainCandidate): NeuralCoreNodeKind => {
  if (candidate.centerStrength > 0.9 && index % 83 === 0) {
    return "core";
  }

  if (index % 43 === 0 || candidate.stemStrength > 0.76 && index % 37 === 0) {
    return "hub";
  }

  if (index % 4 === 0 || candidate.edgeStrength > 0.78 || candidate.centerStrength > 0.62 && index % 3 === 0) {
    return "standard";
  }

  return "micro";
};

const getNodeColor = (kind: NeuralCoreNodeKind, isOuter: boolean, index: number): string => {
  if (kind === "core") {
    return index % 2 === 0 ? "#e6fbff" : "#8ff4ff";
  }

  if (kind === "hub") {
    if (index % 13 === 0) {
      return "#d9f7ff";
    }

    if (index % 17 === 0) {
      return "#8a6dff";
    }

    return index % 3 === 0 ? "#26d9ff" : "#3aa4ff";
  }

  if (isOuter) {
    return index % 7 === 0 ? "#8fdfff" : index % 2 === 0 ? "#26d9ff" : "#2f8dff";
  }

  if (index % 29 === 0) {
    return "#7d6dff";
  }

  return index % 3 === 0 ? "#28dfff" : index % 3 === 1 ? "#35a7ff" : "#79dfff";
};

const createNode = (index: number, candidate: BrainCandidate, random: SeededRandom): NeuralCoreNode => {
  const kind = getNodeKind(index, candidate);
  const isOuter = candidate.edgeStrength > 0.72;
  const intensity = kind === "core" ? 1 : kind === "hub" ? 0.74 : isOuter ? 0.6 : 0.42;
  const radius = kind === "core"
    ? 0.032 + random.next() * 0.006
    : kind === "hub"
      ? 0.017 + random.next() * 0.006
      : kind === "standard"
        ? 0.011 + random.next() * 0.004
        : 0.0055 + random.next() * 0.002;

  return {
    id: index,
    position: candidate.position,
    kind,
    isOuter,
    intensity,
    radius,
    baseScale: kind === "core" ? 1.02 : kind === "hub" ? 0.94 + random.next() * 0.08 : 1,
    phase: index * 0.41 + random.next() * Math.PI,
    color: getNodeColor(kind, isOuter, index),
  };
};

const createCentralCoreNode = (): NeuralCoreNode => {
  return {
    id: 0,
    position: CORE_POSITION,
    kind: "core",
    isOuter: false,
    intensity: 1,
    radius: 0.032,
    baseScale: 1.02,
    phase: 0.7,
    color: "#e6fbff",
  };
};

const createNodes = (nodeCount: number): NeuralCoreNode[] => {
  const random = createSeededRandom(83917);
  const nodes: NeuralCoreNode[] = [];
  let attempts = 0;

  while (nodes.length < nodeCount && attempts < nodeCount * 120) {
    const candidate = getBrainCandidate(random);
    attempts += 1;

    if (!candidate) {
      continue;
    }

    nodes.push(createNode(nodes.length, candidate, random));
  }

  return nodes;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const normalizedHex = hex.replace("#", "");
  const value = Number.parseInt(normalizedHex, 16);

  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
};

const createPointCloud = (
  kind: NeuralCorePointCloudKind,
  nodes: NeuralCoreNode[],
  size: number,
  opacity: number,
): NeuralCorePointCloud => {
  const positions = new Float32Array(nodes.length * 3);
  const colors = new Float32Array(nodes.length * 3);

  nodes.forEach((node, index): void => {
    const offset = index * 3;
    const color = hexToRgb(node.color);

    positions.set(node.position, offset);
    colors.set(color, offset);
  });

  return {
    kind,
    positions,
    colors,
    size,
    opacity,
  };
};

const createNodeClouds = (nodes: NeuralCoreNode[]): NeuralCorePointCloud[] => {
  const microNodes = nodes.filter((node) => node.kind === "micro");
  const standardNodes = nodes.filter((node) => node.kind === "standard" && !node.isOuter);
  const outerNodes = nodes.filter((node) => node.kind === "standard" && node.isOuter);

  return [
    createPointCloud("micro", microNodes, 0.0074, 0.96),
    createPointCloud("standard", standardNodes, 0.0115, 0.95),
    createPointCloud("outer", outerNodes, 0.014, 0.98),
  ];
};

const getConnectionBucket = (strength: number, isHubConnection: boolean): NeuralCoreConnectionBucket => {
  if (isHubConnection) {
    return "hub";
  }

  if (strength > 0.72) {
    return "high";
  }

  if (strength > 0.48) {
    return "medium";
  }

  return "low";
};

const getMaxConnections = (node: NeuralCoreNode): number => {
  if (node.kind === "hub" || node.kind === "core") {
    return MAX_CONNECTIONS_PER_HUB_NODE;
  }

  if (node.kind === "standard") {
    return MAX_CONNECTIONS_PER_STANDARD_NODE;
  }

  return MAX_CONNECTIONS_PER_MICRO_NODE;
};

const createLocalConnections = (nodes: NeuralCoreNode[]): NeuralCoreConnection[] => {
  return nodes.flatMap((node) => {
    const maxConnections = getMaxConnections(node);
    const threshold = node.isOuter ? CONNECTION_THRESHOLD * 1.08 : CONNECTION_THRESHOLD;

    return nodes
      .filter((candidate) => candidate.id !== node.id)
      .map((candidate) => ({
        candidate,
        distance: getDistance(node.position, candidate.position),
      }))
      .filter(({ distance }) => distance <= threshold)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxConnections)
      .filter(({ candidate }) => candidate.id > node.id)
      .map(({ candidate, distance }) => {
        const strength = clamp(1 - distance / threshold, 0.14, 0.88);
        const isHubConnection = node.kind === "hub" || node.kind === "core" || candidate.kind === "hub" || candidate.kind === "core";

        return {
          id: `${node.id}-${candidate.id}`,
          from: node.position,
          to: candidate.position,
          opacity: 0.035 + strength * 0.16,
          strength,
          bucket: getConnectionBucket(strength, isHubConnection),
        };
      });
  });
};

const createHubConnections = (nodes: NeuralCoreNode[]): NeuralCoreConnection[] => {
  const hubs = nodes.filter((node) => node.kind === "hub" || node.kind === "core");

  return hubs.flatMap((node) => {
    return hubs
      .filter((candidate) => candidate.id !== node.id)
      .map((candidate) => ({
        candidate,
        distance: getDistance(node.position, candidate.position),
      }))
      .filter(({ distance }) => distance <= HUB_CONNECTION_THRESHOLD)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 7)
      .filter(({ candidate }) => candidate.id > node.id)
      .map(({ candidate, distance }) => {
        const strength = clamp(1 - distance / HUB_CONNECTION_THRESHOLD, 0.2, 0.68);

        return {
          id: `hub-${node.id}-${candidate.id}`,
          from: node.position,
          to: candidate.position,
          opacity: 0.07 + strength * 0.12,
          strength,
          bucket: "hub",
        };
      });
  });
};

const createCoreConnections = (nodes: NeuralCoreNode[]): NeuralCoreConnection[] => {
  const highlights = nodes
    .filter((node) => node.kind === "hub" || node.kind === "core")
    .slice(0, 18);

  return highlights.map((node) => ({
    id: `core-${node.id}`,
    from: CORE_POSITION,
    to: node.position,
    opacity: 0.12,
    strength: 0.54,
    bucket: "hub",
  }));
};

const getBucketOpacity = (bucket: NeuralCoreConnectionBucket): number => {
  switch (bucket) {
    case "hub":
      return 0.21;
    case "high":
      return 0.24;
    case "medium":
      return 0.13;
    case "low":
      return 0.048;
  }
};

const getBucketColor = (bucket: NeuralCoreConnectionBucket): string => {
  switch (bucket) {
    case "hub":
      return "#93eaff";
    case "high":
      return "#26d9ff";
    case "medium":
      return "#2f8dff";
    case "low":
      return "#356bff";
  }
};

const createConnectionBuffers = (connections: NeuralCoreConnection[]): NeuralCoreConnectionBuffer[] => {
  const buckets: NeuralCoreConnectionBucket[] = ["low", "medium", "high", "hub"];

  return buckets
    .map((bucket) => {
      const bucketConnections = connections.filter((connection) => connection.bucket === bucket);
      const positions = new Float32Array(bucketConnections.length * 6);

      bucketConnections.forEach((connection, index): void => {
        const offset = index * 6;

        positions.set(connection.from, offset);
        positions.set(connection.to, offset + 3);
      });

      return {
        bucket,
        positions,
        opacity: getBucketOpacity(bucket),
        color: getBucketColor(bucket),
      };
    })
    .filter((buffer) => buffer.positions.length > 0);
};

const createParticles = (particleCount: number): NeuralCoreParticle[] => {
  const random = createSeededRandom(29173);

  return Array.from({ length: particleCount }, (_, index): NeuralCoreParticle => {
    const angle = random.next() * Math.PI * 2;
    const radius = 1.15 + random.next() * 1.62;
    const y = (random.next() * 2 - 1) * 1.18;

    return {
      id: index,
      basePosition: [Math.cos(angle) * radius, y, Math.sin(angle) * radius * 0.56],
      drift: [0.03 + random.next() * 0.07, 0.018 + random.next() * 0.04, 0.026 + random.next() * 0.06],
      phase: random.next() * Math.PI * 2,
      speed: 0.045 + random.next() * 0.07,
    };
  });
};

const createParticleField = (particles: NeuralCoreParticle[]): NeuralCoreParticleField => {
  const positions = new Float32Array(particles.length * 3);
  const colors = new Float32Array(particles.length * 3);

  particles.forEach((particle, index): void => {
    const offset = index * 3;
    const color = index % 17 === 0 ? hexToRgb("#7d6dff") : index % 9 === 0 ? hexToRgb("#8fdfff") : hexToRgb("#2f8dff");

    positions.set(particle.basePosition, offset);
    colors.set(color, offset);
  });

  return {
    positions,
    colors,
    size: 0.0072,
    opacity: 0.34,
  };
};

const getPulseColor = (connection: NeuralCoreConnection, index: number): string => {
  if (connection.bucket === "hub") {
    return index % 5 === 0 ? "#d9f7ff" : "#8ff4ff";
  }

  if (index % 17 === 0) {
    return "#8a6dff";
  }

  return index % 3 === 0 ? "#e6fbff" : "#26d9ff";
};

const createPulseRoutes = (
  sourceConnections: NeuralCoreConnection[],
  pulseIndex: number,
  routeCount: number,
): NeuralCorePulseRoute[] => {
  return Array.from({ length: routeCount }, (_, routeIndex): NeuralCorePulseRoute => {
    const connection = sourceConnections[(pulseIndex * 11 + routeIndex * 17) % sourceConnections.length];

    return {
      from: connection.from,
      to: connection.to,
    };
  });
};

const createPulses = (connections: NeuralCoreConnection[], pulseCount: number): NeuralCorePulse[] => {
  const random = createSeededRandom(63149);
  const candidates = connections
    .filter((connection) => connection.bucket === "hub" || connection.bucket === "high" || connection.bucket === "medium")
    .sort((a, b) => b.strength - a.strength);
  const sourceConnections = candidates.length > 0 ? candidates : connections;

  return Array.from({ length: pulseCount }, (_, index): NeuralCorePulse => {
    const connection = sourceConnections[(index * 7) % sourceConnections.length];

    return {
      id: index,
      routes: createPulseRoutes(sourceConnections, index, 5),
      speed: 0.18 + random.next() * 0.2,
      phase: random.next() * 5,
      color: getPulseColor(connection, index),
    };
  });
};

const createPulseField = (pulses: NeuralCorePulse[]): NeuralCorePulseField => {
  const positions = new Float32Array(pulses.length * 3);
  const colors = new Float32Array(pulses.length * 3);

  pulses.forEach((pulse, index): void => {
    const offset = index * 3;
    const firstRoute = pulse.routes[0];

    positions.set(firstRoute.from, offset);
    colors.set(hexToRgb(pulse.color), offset);
  });

  return {
    positions,
    colors,
    size: 0.031,
    opacity: 0.98,
  };
};

const createRings = (): NeuralCoreRing[] => {
  return [
    {
      id: 0,
      radius: 1.78,
      tubeRadius: 0.0024,
      rotation: [Math.PI * 0.56, 0.16, Math.PI * 0.08],
      color: "#26d9ff",
      opacity: 0.2,
      speed: 0.035,
      phase: 0.4,
    },
    {
      id: 1,
      radius: 1.28,
      tubeRadius: 0.0022,
      rotation: [Math.PI * 0.36, Math.PI * 0.44, Math.PI * 0.31],
      color: "#8a6dff",
      opacity: 0.15,
      speed: -0.047,
      phase: 1.8,
    },
    {
      id: 2,
      radius: 2.08,
      tubeRadius: 0.0018,
      rotation: [Math.PI * 0.72, Math.PI * 0.2, Math.PI * 0.62],
      color: "#8fdfff",
      opacity: 0.11,
      speed: 0.024,
      phase: 3.2,
    },
  ];
};

export const createNeuralCoreGraph = (nodeCount = NEURAL_NODE_COUNT): NeuralCoreGraph => {
  const nodes = [
    createCentralCoreNode(),
    ...createNodes(nodeCount - 1).map((node) => ({
      ...node,
      id: node.id + 1,
    })),
  ];
  const connections = [
    ...createLocalConnections(nodes),
    ...createHubConnections(nodes),
    ...createCoreConnections(nodes),
  ];
  const particles = createParticles(AMBIENT_PARTICLE_COUNT);
  const pulses = createPulses(connections, ACTIVE_PULSE_COUNT);

  return {
    nodes,
    hubs: nodes.filter((node) => node.kind === "hub"),
    coreNodes: nodes.filter((node) => node.kind === "core"),
    nodeClouds: createNodeClouds(nodes),
    connections,
    connectionBuffers: createConnectionBuffers(connections),
    particles,
    particleField: createParticleField(particles),
    pulses,
    pulseField: createPulseField(pulses),
    rings: createRings(),
  };
};
