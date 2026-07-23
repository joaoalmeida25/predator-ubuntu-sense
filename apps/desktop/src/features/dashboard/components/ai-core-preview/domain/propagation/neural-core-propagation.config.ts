import type {
  NeuralCorePropagationConfig,
  NeuralCorePropagationConfigInput,
  NeuralCorePropagationPreset,
} from "./neural-core-propagation.types";

export const DEFAULT_NEURAL_CORE_PROPAGATION_CONFIG: NeuralCorePropagationConfig = {
  enabled: true,
  timing: {
    baseTransmissionDurationSeconds: 2.4,
    minimumTransmissionDurationSeconds: 0.55,
    maximumTransmissionDurationSeconds: 6,
    maximumDeltaSeconds: 0.05,
    maximumCatchUpSeconds: 0.25,
    maximumSubstepsPerAdvance: 8,
    pathwayStageOverlap: 0.18,
    destinationActivationThreshold: 0.72,
  },
  activation: {
    sourceActivationGain: 0.34,
    destinationActivationGain: 0.86,
    propagationGain: 0.72,
    maximumClusterActivation: 1,
    activationDecayPerSecond: 0.32,
    inhibitoryDecayMultiplier: 1.35,
    modulatoryPersistenceMultiplier: 1.6,
  },
  synapse: {
    weightInfluence: 0.62,
    conductivityInfluence: 0.7,
    plasticityInfluence: 0.28,
    inactiveRouteOpacity: 0.035,
    activeRouteOpacity: 0.24,
  },
  pulse: {
    baseSize: 0.056,
    intensityMultiplier: 1,
    headScale: 1.16,
    headBrightness: 1.28,
    fadeInFraction: 0.16,
    fadeOutFraction: 0.18,
    destinationBoostFraction: 0.22,
    trailLength: 0.08,
    trailOpacityFalloff: 1.72,
    routeBackgroundOpacity: 0.42,
    arrivalBurstIntensity: 0.32,
    minimumScreenSize: 2.5,
    maximumScreenSize: 18,
    distanceScaleInfluence: 0.72,
    trailSampleCount: 7,
  },
  runtime: {
    maximumConcurrentTransmissions: 12,
    loopActivePathways: false,
    completedPropagationRetentionSeconds: 0.8,
    deterministicSeed: 1729,
  },
  visual: {
    routeSegmentCount: 12,
    pulseTrailPointCount: 7,
    minimumPulseSize: 0.025,
    maximumPulseSize: 0.12,
  },
  motion: {
    rotationActivityInfluence: 0.08,
    breathingActivityInfluence: 0.12,
    particleActivityInfluence: 0.1,
  },
};

const finiteOr = (value: number | undefined, fallback: number): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const positiveOr = (value: number | undefined, fallback: number): number => {
  return Math.max(0.001, finiteOr(value, fallback));
};

const normalizedOr = (value: number | undefined, fallback: number): number => {
  return Math.min(1, Math.max(0, finiteOr(value, fallback)));
};

const boundedIntegerOr = (
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number => {
  return Math.min(maximum, Math.max(minimum, Math.trunc(finiteOr(value, fallback))));
};

const mergeConfig = (
  base: NeuralCorePropagationConfig,
  input?: NeuralCorePropagationConfigInput,
): NeuralCorePropagationConfig => {
  const minimumDuration = positiveOr(
    input?.timing?.minimumTransmissionDurationSeconds,
    base.timing.minimumTransmissionDurationSeconds,
  );
  const maximumDuration = Math.max(
    minimumDuration,
    positiveOr(
      input?.timing?.maximumTransmissionDurationSeconds,
      base.timing.maximumTransmissionDurationSeconds,
    ),
  );
  const minimumPulseSize = Math.min(
    0.25,
    Math.max(0.005, positiveOr(
      input?.visual?.minimumPulseSize,
      base.visual.minimumPulseSize,
    )),
  );
  const maximumPulseSize = Math.min(
    0.25,
    Math.max(minimumPulseSize, positiveOr(
      input?.visual?.maximumPulseSize,
      base.visual.maximumPulseSize,
    )),
  );
  const minimumScreenSize = Math.min(
    24,
    Math.max(1, finiteOr(input?.pulse?.minimumScreenSize, base.pulse.minimumScreenSize)),
  );
  const maximumScreenSize = Math.min(
    48,
    Math.max(
      minimumScreenSize,
      finiteOr(input?.pulse?.maximumScreenSize, base.pulse.maximumScreenSize),
    ),
  );
  const trailSampleCount = boundedIntegerOr(
    input?.pulse?.trailSampleCount ?? input?.visual?.pulseTrailPointCount,
    base.pulse.trailSampleCount,
    1,
    8,
  );

  return {
    enabled: input?.enabled ?? base.enabled,
    timing: {
      baseTransmissionDurationSeconds: Math.min(
        maximumDuration,
        Math.max(
          minimumDuration,
          positiveOr(
            input?.timing?.baseTransmissionDurationSeconds,
            base.timing.baseTransmissionDurationSeconds,
          ),
        ),
      ),
      minimumTransmissionDurationSeconds: minimumDuration,
      maximumTransmissionDurationSeconds: maximumDuration,
      maximumDeltaSeconds: Math.min(
        1,
        positiveOr(input?.timing?.maximumDeltaSeconds, base.timing.maximumDeltaSeconds),
      ),
      maximumCatchUpSeconds: Math.min(
        5,
        positiveOr(
          input?.timing?.maximumCatchUpSeconds,
          base.timing.maximumCatchUpSeconds,
        ),
      ),
      maximumSubstepsPerAdvance: boundedIntegerOr(
        input?.timing?.maximumSubstepsPerAdvance,
        base.timing.maximumSubstepsPerAdvance,
        1,
        64,
      ),
      pathwayStageOverlap: normalizedOr(
        input?.timing?.pathwayStageOverlap,
        base.timing.pathwayStageOverlap,
      ),
      destinationActivationThreshold: normalizedOr(
        input?.timing?.destinationActivationThreshold,
        base.timing.destinationActivationThreshold,
      ),
    },
    activation: {
      sourceActivationGain: Math.max(
        0,
        finiteOr(input?.activation?.sourceActivationGain, base.activation.sourceActivationGain),
      ),
      destinationActivationGain: Math.max(
        0,
        finiteOr(
          input?.activation?.destinationActivationGain,
          base.activation.destinationActivationGain,
        ),
      ),
      propagationGain: Math.max(
        0,
        finiteOr(input?.activation?.propagationGain, base.activation.propagationGain),
      ),
      maximumClusterActivation: positiveOr(
        input?.activation?.maximumClusterActivation,
        base.activation.maximumClusterActivation,
      ),
      activationDecayPerSecond: Math.max(
        0,
        finiteOr(
          input?.activation?.activationDecayPerSecond,
          base.activation.activationDecayPerSecond,
        ),
      ),
      inhibitoryDecayMultiplier: positiveOr(
        input?.activation?.inhibitoryDecayMultiplier,
        base.activation.inhibitoryDecayMultiplier,
      ),
      modulatoryPersistenceMultiplier: positiveOr(
        input?.activation?.modulatoryPersistenceMultiplier,
        base.activation.modulatoryPersistenceMultiplier,
      ),
    },
    synapse: {
      weightInfluence: normalizedOr(
        input?.synapse?.weightInfluence,
        base.synapse.weightInfluence,
      ),
      conductivityInfluence: normalizedOr(
        input?.synapse?.conductivityInfluence,
        base.synapse.conductivityInfluence,
      ),
      plasticityInfluence: normalizedOr(
        input?.synapse?.plasticityInfluence,
        base.synapse.plasticityInfluence,
      ),
      inactiveRouteOpacity: normalizedOr(
        input?.synapse?.inactiveRouteOpacity,
        base.synapse.inactiveRouteOpacity,
      ),
      activeRouteOpacity: normalizedOr(
        input?.synapse?.activeRouteOpacity,
        base.synapse.activeRouteOpacity,
      ),
    },
    pulse: {
      baseSize: positiveOr(input?.pulse?.baseSize, base.pulse.baseSize),
      intensityMultiplier: Math.max(
        0,
        finiteOr(input?.pulse?.intensityMultiplier, base.pulse.intensityMultiplier),
      ),
      headScale: Math.min(
        1.6,
        Math.max(1, finiteOr(input?.pulse?.headScale, base.pulse.headScale)),
      ),
      headBrightness: Math.min(
        1.8,
        Math.max(1, finiteOr(input?.pulse?.headBrightness, base.pulse.headBrightness)),
      ),
      fadeInFraction: normalizedOr(input?.pulse?.fadeInFraction, base.pulse.fadeInFraction),
      fadeOutFraction: normalizedOr(input?.pulse?.fadeOutFraction, base.pulse.fadeOutFraction),
      destinationBoostFraction: normalizedOr(
        input?.pulse?.destinationBoostFraction,
        base.pulse.destinationBoostFraction,
      ),
      trailLength: normalizedOr(input?.pulse?.trailLength, base.pulse.trailLength),
      trailOpacityFalloff: Math.min(
        4,
        Math.max(
          0.5,
          finiteOr(
            input?.pulse?.trailOpacityFalloff,
            base.pulse.trailOpacityFalloff,
          ),
        ),
      ),
      routeBackgroundOpacity: normalizedOr(
        input?.pulse?.routeBackgroundOpacity,
        base.pulse.routeBackgroundOpacity,
      ),
      arrivalBurstIntensity: normalizedOr(
        input?.pulse?.arrivalBurstIntensity,
        base.pulse.arrivalBurstIntensity,
      ),
      minimumScreenSize,
      maximumScreenSize,
      distanceScaleInfluence: normalizedOr(
        input?.pulse?.distanceScaleInfluence,
        base.pulse.distanceScaleInfluence,
      ),
      trailSampleCount,
    },
    runtime: {
      maximumConcurrentTransmissions: Math.max(
        0,
        Math.floor(finiteOr(
          input?.runtime?.maximumConcurrentTransmissions,
          base.runtime.maximumConcurrentTransmissions,
        )),
      ),
      loopActivePathways: input?.runtime?.loopActivePathways
        ?? base.runtime.loopActivePathways,
      completedPropagationRetentionSeconds: Math.max(
        0,
        finiteOr(
          input?.runtime?.completedPropagationRetentionSeconds,
          base.runtime.completedPropagationRetentionSeconds,
        ),
      ),
      deterministicSeed: Math.trunc(finiteOr(
        input?.runtime?.deterministicSeed,
        base.runtime.deterministicSeed,
      )),
    },
    visual: {
      routeSegmentCount: boundedIntegerOr(
        input?.visual?.routeSegmentCount,
        base.visual.routeSegmentCount,
        2,
        64,
      ),
      pulseTrailPointCount: boundedIntegerOr(
        trailSampleCount,
        trailSampleCount,
        1,
        8,
      ),
      minimumPulseSize,
      maximumPulseSize,
    },
    motion: {
      rotationActivityInfluence: Math.max(
        0,
        finiteOr(
          input?.motion?.rotationActivityInfluence,
          base.motion.rotationActivityInfluence,
        ),
      ),
      breathingActivityInfluence: Math.max(
        0,
        finiteOr(
          input?.motion?.breathingActivityInfluence,
          base.motion.breathingActivityInfluence,
        ),
      ),
      particleActivityInfluence: Math.max(
        0,
        finiteOr(
          input?.motion?.particleActivityInfluence,
          base.motion.particleActivityInfluence,
        ),
      ),
    },
  };
};

export const resolveNeuralCorePropagationConfig = (
  input?: NeuralCorePropagationConfigInput,
): NeuralCorePropagationConfig => {
  return mergeConfig(DEFAULT_NEURAL_CORE_PROPAGATION_CONFIG, input);
};

export const CALM_NEURAL_CORE_PROPAGATION_CONFIG: NeuralCorePropagationConfig = mergeConfig(
  DEFAULT_NEURAL_CORE_PROPAGATION_CONFIG,
  {
    timing: { baseTransmissionDurationSeconds: 3.4, pathwayStageOverlap: 0.1 },
    activation: { propagationGain: 0.48, activationDecayPerSecond: 0.25 },
    pulse: { intensityMultiplier: 0.72 },
    motion: {
      rotationActivityInfluence: 0.045,
      breathingActivityInfluence: 0.08,
      particleActivityInfluence: 0.065,
    },
  },
);
export const BALANCED_NEURAL_CORE_PROPAGATION_CONFIG: NeuralCorePropagationConfig = resolveNeuralCorePropagationConfig();
export const INTENSE_NEURAL_CORE_PROPAGATION_CONFIG: NeuralCorePropagationConfig = mergeConfig(
  DEFAULT_NEURAL_CORE_PROPAGATION_CONFIG,
  {
    timing: { baseTransmissionDurationSeconds: 1.55, pathwayStageOverlap: 0.3 },
    activation: { propagationGain: 0.94, activationDecayPerSecond: 0.42 },
    pulse: { intensityMultiplier: 1.3 },
    motion: {
      rotationActivityInfluence: 0.12,
      breathingActivityInfluence: 0.18,
      particleActivityInfluence: 0.16,
    },
  },
);

export const getNeuralCorePropagationPresetConfig = (
  preset?: NeuralCorePropagationPreset,
): NeuralCorePropagationConfig => {
  if (preset === "calm") {
    return CALM_NEURAL_CORE_PROPAGATION_CONFIG;
  }

  if (preset === "intense") {
    return INTENSE_NEURAL_CORE_PROPAGATION_CONFIG;
  }

  return BALANCED_NEURAL_CORE_PROPAGATION_CONFIG;
};

export const resolveNeuralCorePropagationOptions = (
  preset?: NeuralCorePropagationPreset,
  input?: NeuralCorePropagationConfigInput,
): NeuralCorePropagationConfig => {
  return mergeConfig(getNeuralCorePropagationPresetConfig(preset), input);
};

export const createNeuralCorePropagationConfigKey = (
  config: NeuralCorePropagationConfig,
): string => {
  return JSON.stringify(config);
};
